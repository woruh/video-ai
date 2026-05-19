package main

import (
	"github.com/gorilla/websocket"
	"net/http"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

var clients = make(map[*websocket.Conn]bool)

func wsHandler(w http.ResponseWriter, r *http.Request) {

	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		return
	}

	clients[conn] = true

	for {
		_, _, err := conn.ReadMessage()
		if err != nil {
			delete(clients, conn)
			conn.Close()
			break
		}
	}
}

func broadcast(message interface{}) {
	for client := range clients {
		client.WriteJSON(message)
	}
}