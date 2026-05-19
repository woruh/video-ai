package storage

import (
	"encoding/json"
	"os"
)

func LoadJSON(filename string, target interface{}) error {

	data, err := os.ReadFile(filename)

	if err != nil {
		return err
	}

	err = json.Unmarshal(data, target)

	if err != nil {
		return err
	}

	return nil
}