package storage

import (
	"encoding/json"
	"fmt"
	"os"
)

func SaveJSON(filename string, data interface{}) error {

	jsonData, err := json.MarshalIndent(data, "", "  ")

	if err != nil {
		return err
	}

	err = os.WriteFile(filename, jsonData, 0644)

	if err != nil {
		return err
	}

	fmt.Println("JSON saved to", filename)

	return nil
}