package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	APIKey string
	APIURL string
}

func LoadConfig() Config {

	err := godotenv.Load()

	if err != nil {
		log.Println("No .env file found")
	}

	cfg := Config{
		APIKey: os.Getenv("AI_API_KEY"),
		APIURL: os.Getenv("AI_API_URL"),
	}

	return cfg
}