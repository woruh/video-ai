package scene

import (
	"strings"
	"story-ai/models"
)

func AnalyzeScene(text string) (string, string, string) {

	lower := strings.ToLower(text)

	emotion := "neutral"
	camera := "static"
	mood := "normal"

	if strings.Contains(lower, "dark") ||
		strings.Contains(lower, "shadow") ||
		strings.Contains(lower, "night") {
		emotion = "fear"
		mood = "dark"
		camera = "wide shot"
	}

	return emotion, camera, mood
}

func SplitStoryIntoScenes(story string) []models.Scene {

	rawScenes := strings.Split(story, ".")

	var scenes []models.Scene

	for i, sceneText := range rawScenes {

		clean := strings.TrimSpace(sceneText)

		if clean != "" {

			emotion, camera, mood := AnalyzeScene(clean)

			newScene := models.Scene{
				Number:  i + 1,
				Text:    clean,
				Emotion: emotion,
				Camera:  camera,
				Mood:    mood,
			}

			scenes = append(scenes, newScene)
		}
	}

	return scenes
}