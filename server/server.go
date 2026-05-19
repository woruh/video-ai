package server

import (
	"encoding/json"
	"fmt"
	"net/http"
	//"time"

	"story-ai/ai"
	"story-ai/config"
	"story-ai/models"
	"story-ai/prompt"
	"story-ai/scene"
)

// -------------------------
// REQUEST STRUCT
// -------------------------
type GenerateRequest struct {
	Story string `json:"story"`
}

// -------------------------
// RESPONSE STRUCT
// -------------------------
type GenerateResponse struct {
	Message string             `json:"message"`
	Jobs    []models.VideoJob `json:"jobs"`
}

// -------------------------
// START SERVER
// -------------------------
func StartServer() {
	

	http.HandleFunc("/status", enableCORS(handleStatus))

	http.HandleFunc("/generate", enableCORS(handleGenerate))

	http.HandleFunc("/ws", wsHandler)

	fmt.Println("Server running on :8080")

	http.ListenAndServe(":8080", nil)
}

// -------------------------
// CORS MIDDLEWARE
// -------------------------
func enableCORS(next http.HandlerFunc) http.HandlerFunc {

	return func(w http.ResponseWriter, r *http.Request) {

		w.Header().Set("Access-Control-Allow-Origin", "http://localhost:5173")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		w.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS")

		// Handle preflight request
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		next(w, r)
	}
}

// -------------------------
// MAIN HANDLER
// -------------------------
func handleGenerate(w http.ResponseWriter, r *http.Request) {

	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req GenerateRequest
	json.NewDecoder(r.Body).Decode(&req)

	cfg := config.LoadConfig()
	client := ai.NewClient(cfg)

	scenes := scene.SplitStoryIntoScenes(req.Story)

	var jobs []models.VideoJob

	for _, s := range scenes {

		promptText := prompt.GeneratePrompt(s)

		resp, err := client.GenerateVideo(promptText)
		if err != nil {
			continue
		}

		job := models.VideoJob{
			SceneNumber: s.Number,
			Prompt:      promptText,
			JobID:       resp.JobID,
			Status:      resp.Status,
		}

		jobs = append(jobs, job)
	}

	// ❗ IMPORTANT: NO WAITING LOOP ANYMORE

	response := GenerateResponse{
		Message: "Jobs started",
		Jobs:    jobs,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

func handleStatus(w http.ResponseWriter, r *http.Request) {

	if r.Method != "GET" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	jobID := r.URL.Query().Get("id")

	cfg := config.LoadConfig()
	client := ai.NewClient(cfg)

	status, err := client.CheckJob(jobID)
	if err != nil {
		http.Error(w, "Error checking job", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(status)
}