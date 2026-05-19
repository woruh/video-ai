package models

type Scene struct {
	Number  int    `json:"number"`
	Text    string `json:"text"`
	Emotion string `json:"emotion"`
	Camera  string `json:"camera"`
	Mood    string `json:"mood"`
}