package realtime

import (
	"net/http"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

var Clients = make(map[*websocket.Conn]bool)

func WSHandler(w http.ResponseWriter, r *http.Request) {

	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		return
	}

	Clients[conn] = true

	for {
		_, _, err := conn.ReadMessage()

		if err != nil {
			delete(Clients, conn)
			conn.Close()
			break
		}
	}
}

func Broadcast(message interface{}) {

	for client := range Clients {
		client.WriteJSON(message)
	}
}