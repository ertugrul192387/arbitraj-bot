package main

import (
	"encoding/json"
	"fmt"
	"io"
	"math"
	"net/http"
	"sort"
	"strconv"
	"sync"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
)

// Top 100 coin listesi
var coinList = []string{
	"BTC", "ETH", "BNB", "XRP", "ADA", "DOGE", "SOL", "DOT", "MATIC", "LTC",
	"SHIB", "TRX", "AVAX", "LINK", "ATOM", "UNI", "ETC", "XMR", "XLM", "BCH",
	"APT", "FIL", "LDO", "ARB", "NEAR", "VET", "ALGO", "QNT", "GRT", "AAVE",
	"EOS", "STX", "EGLD", "SAND", "THETA", "AXS", "IMX", "MANA", "XTZ", "NEO",
	"KCS", "FLOW", "CHZ", "CRV", "KAVA", "GALA", "FTM", "MINA", "ZEC", "DASH",
	"ENJ", "BAT", "LRC", "QTUM", "ZIL", "ONE", "HOT", "ENS", "COMP", "SNX",
	"1INCH", "YFI", "SUSHI", "ANKR", "CVC", "OMG", "ICX", "SC", "ZEN", "WAVES",
	"IOST", "ONT", "WRX", "RVN", "CELR", "COTI", "STORJ", "FET", "OCEAN", "BAND",
	"SKL", "DENT", "SXP", "REEF", "ALICE", "TLM", "LINA", "PERL", "HARD", "DODO",
	"ALPHA", "TORN", "BURGER", "SFP", "LOOM", "VITE", "FIRO", "WING", "AKRO", "FOR",
}

// Binance API yanıt yapısı
type BinanceTickerResponse struct {
	Symbol string `json:"symbol"`
	Price  string `json:"price"`
}

// Gate.io API yanıt yapısı
type GateioTickerResponse struct {
	CurrencyPair string `json:"currency_pair"`
	Last         string `json:"last"`
}

// Coin fiyat karşılaştırma
type CoinComparison struct {
	Symbol         string  `json:"symbol"`
	BinancePrice   float64 `json:"binance_fiyat"`
	GateioPrice    float64 `json:"gateio_fiyat"`
	DiffPercent    float64 `json:"fark_yuzde"`
	CheapExchange  string  `json:"ucuz_borsa"`
	ExpensiveEx    string  `json:"pahali_borsa"`
	IsOpportunity  bool    `json:"arbitraj_firsati"`
}

// Tüm response
type AllCoinsResponse struct {
	Opportunities []CoinComparison `json:"firsatlar"`
	AllCoins      []CoinComparison `json:"tum_coinler"`
	UpdatedAt     string           `json:"guncelleme_zamani"`
}

// HTTP client timeout ile
var httpClient = &http.Client{
	Timeout: 15 * time.Second,
}

// Binance'den tüm fiyatları çeker
func getBinancePrices() (map[string]float64, error) {
	url := "https://api.binance.com/api/v3/ticker/price"

	resp, err := httpClient.Get(url)
	if err != nil {
		return nil, fmt.Errorf("Binance API'ye bağlanılamadı: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("Binance API hata kodu: %d", resp.StatusCode)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("Binance yanıtı okunamadı: %v", err)
	}

	var tickers []BinanceTickerResponse
	if err := json.Unmarshal(body, &tickers); err != nil {
		return nil, fmt.Errorf("Binance JSON parse hatası: %v", err)
	}

	prices := make(map[string]float64)
	for _, ticker := range tickers {
		// USDT çiftlerini filtrele
		if len(ticker.Symbol) > 4 && ticker.Symbol[len(ticker.Symbol)-4:] == "USDT" {
			symbol := ticker.Symbol[:len(ticker.Symbol)-4]
			if price, err := strconv.ParseFloat(ticker.Price, 64); err == nil {
				prices[symbol] = price
			}
		}
	}

	return prices, nil
}

// Gate.io'dan tüm fiyatları çeker
func getGateioPrices() (map[string]float64, error) {
	url := "https://api.gateio.ws/api/v4/spot/tickers"

	resp, err := httpClient.Get(url)
	if err != nil {
		return nil, fmt.Errorf("Gate.io API'ye bağlanılamadı: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("Gate.io API hata kodu: %d", resp.StatusCode)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("Gate.io yanıtı okunamadı: %v", err)
	}

	var tickers []GateioTickerResponse
	if err := json.Unmarshal(body, &tickers); err != nil {
		return nil, fmt.Errorf("Gate.io JSON parse hatası: %v", err)
	}

	prices := make(map[string]float64)
	for _, ticker := range tickers {
		// USDT çiftlerini filtrele
		pair := ticker.CurrencyPair
		if len(pair) > 5 && pair[len(pair)-5:] == "_USDT" {
			symbol := pair[:len(pair)-5]
			if price, err := strconv.ParseFloat(ticker.Last, 64); err == nil {
				prices[symbol] = price
			}
		}
	}

	return prices, nil
}

// Yüzdelik farkı hesaplar
func calculateDiffPercent(price1, price2 float64) float64 {
	if price1 == 0 || price2 == 0 {
		return 0
	}
	diff := math.Abs(price1 - price2)
	avg := (price1 + price2) / 2
	return (diff / avg) * 100
}

// Cache için
var (
	cachedResponse *AllCoinsResponse
	cacheMutex     sync.RWMutex
	lastFetch      time.Time
)

func fetchAllCoins() (*AllCoinsResponse, error) {
	// Cache kontrolü (3 saniye)
	cacheMutex.RLock()
	if cachedResponse != nil && time.Since(lastFetch) < 3*time.Second {
		cacheMutex.RUnlock()
		return cachedResponse, nil
	}
	cacheMutex.RUnlock()

	// Paralel olarak her iki borsadan fiyatları çek
	var binancePrices, gateioPrices map[string]float64
	var binanceErr, gateioErr error
	var wg sync.WaitGroup

	wg.Add(2)
	go func() {
		defer wg.Done()
		binancePrices, binanceErr = getBinancePrices()
	}()
	go func() {
		defer wg.Done()
		gateioPrices, gateioErr = getGateioPrices()
	}()
	wg.Wait()

	if binanceErr != nil {
		return nil, binanceErr
	}
	if gateioErr != nil {
		return nil, gateioErr
	}

	var allCoins []CoinComparison
	var opportunities []CoinComparison

	for _, symbol := range coinList {
		binancePrice, hasBinance := binancePrices[symbol]
		gateioPrice, hasGateio := gateioPrices[symbol]

		if !hasBinance || !hasGateio {
			continue
		}

		diffPercent := calculateDiffPercent(binancePrice, gateioPrice)
		diffPercent = math.Round(diffPercent*100) / 100

		var cheapExchange, expensiveEx string
		if binancePrice < gateioPrice {
			cheapExchange = "Binance"
			expensiveEx = "Gate.io"
		} else {
			cheapExchange = "Gate.io"
			expensiveEx = "Binance"
		}

		isOpportunity := diffPercent > 0.3

		coin := CoinComparison{
			Symbol:        symbol,
			BinancePrice:  binancePrice,
			GateioPrice:   gateioPrice,
			DiffPercent:   diffPercent,
			CheapExchange: cheapExchange,
			ExpensiveEx:   expensiveEx,
			IsOpportunity: isOpportunity,
		}

		allCoins = append(allCoins, coin)
		if isOpportunity {
			opportunities = append(opportunities, coin)
		}
	}

	// Fırsatları fark yüzdesine göre sırala (yüksekten düşüğe)
	sort.Slice(opportunities, func(i, j int) bool {
		return opportunities[i].DiffPercent > opportunities[j].DiffPercent
	})

	// Tüm coinleri fark yüzdesine göre sırala
	sort.Slice(allCoins, func(i, j int) bool {
		return allCoins[i].DiffPercent > allCoins[j].DiffPercent
	})

	response := &AllCoinsResponse{
		Opportunities: opportunities,
		AllCoins:      allCoins,
		UpdatedAt:     time.Now().Format("15:04:05"),
	}

	// Cache'e kaydet
	cacheMutex.Lock()
	cachedResponse = response
	lastFetch = time.Now()
	cacheMutex.Unlock()

	return response, nil
}

func main() {
	app := fiber.New()

	// CORS middleware
	app.Use(cors.New(cors.Config{
		AllowOrigins: "http://localhost:3000, https://ertugrulgaziabaci.com.tr, https://www.ertugrulgaziabaci.com.tr",
		AllowHeaders: "Origin, Content-Type, Accept",
	}))

	app.Get("/", func(c *fiber.Ctx) error {
		return c.SendString("Arbitraj Botu Hazır! 100 coin takip ediliyor.")
	})

	// Tüm coinler endpoint'i
	app.Get("/coins", func(c *fiber.Ctx) error {
		response, err := fetchAllCoins()
		if err != nil {
			return c.Status(fiber.StatusServiceUnavailable).JSON(fiber.Map{
				"hata":  true,
				"mesaj": err.Error(),
			})
		}
		return c.JSON(response)
	})

	// Eski endpoint (geriye uyumluluk)
	app.Get("/fiyatlar", func(c *fiber.Ctx) error {
		response, err := fetchAllCoins()
		if err != nil {
			return c.Status(fiber.StatusServiceUnavailable).JSON(fiber.Map{
				"hata":  true,
				"mesaj": err.Error(),
			})
		}

		// BTC'yi bul ve eski formatta döndür
		for _, coin := range response.AllCoins {
			if coin.Symbol == "BTC" {
				return c.JSON(fiber.Map{
					"binance_fiyat":    coin.BinancePrice,
					"gateio_fiyat":     coin.GateioPrice,
					"fark_yuzde":       coin.DiffPercent,
					"ucuz_borsa":       coin.CheapExchange,
					"pahali_borsa":     coin.ExpensiveEx,
					"arbitraj_firsati": coin.IsOpportunity,
				})
			}
		}

		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"hata":  true,
			"mesaj": "BTC bulunamadı",
		})
	})

	fmt.Println("🚀 Arbitraj Botu başlatılıyor...")
	fmt.Println("📊 100 coin takip ediliyor")
	fmt.Println("🌐 http://localhost:8080")
	app.Listen(":8080")
}
