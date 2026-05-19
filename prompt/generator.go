package prompt

import (
	"strings"
	"story-ai/models"
)

func GeneratePrompt(scene models.Scene) string {

	prompt := ""

	// Base scene description
	prompt += "A cinematic scene of " + scene.Text + ". "

	// Mood styling
	if scene.Mood == "dark" {
		prompt += "Dark atmosphere, low lighting, emotional tension. "
	} else if scene.Mood == "intense" {
		prompt += "High energy, fast movement, dramatic tension. "
	} else if scene.Mood == "bright" {
		prompt += "Bright lighting, warm colors, positive mood. "
	}

	// Camera style
	switch strings.ToLower(scene.Camera) {
	case "wide shot":
		prompt += "Wide camera shot, cinematic view. "
	case "close-up":
		prompt += "Close-up shot focusing on facial expressions. "
	case "handheld":
		prompt += "Handheld shaky camera for realism. "
	default:
		prompt += "Standard cinematic framing. "
	}

	// Quality tags (always included)
	prompt += "Ultra realistic, cinematic lighting, 4K film style."

	return prompt
}