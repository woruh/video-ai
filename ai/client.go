package ai

import "story-ai/config"

// -------------------------
// CLIENT STRUCT
// -------------------------
type Client struct {
	Config config.Config
}

// -------------------------
// CREATE CLIENT
// -------------------------
func NewClient(cfg config.Config) *Client {
	return &Client{
		Config: cfg,
	}
}