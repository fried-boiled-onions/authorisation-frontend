import React, { useState, useEffect, useRef, useContext } from "react";
import { useNavigate } from "react-router-dom";
import {
  getUsers,
  getMessages,
  initSignalR,
  getConnection,
  disconnectSignalR,
} from "../utils/api";
import "../styles/globals.css";
import { AuthContext } from "../utils/AuthContext";

const Messenger = () => {
  const [chats, setChats] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedChat, setSelectedChat] = useState(null);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();
  const { logout } = useContext(AuthContext);

  // Инициализация SignalR и загрузка пользователей
  useEffect(() => {
    const setupSignalR = async () => {
      try {
        console.log("Инициализация SignalR...");
        const connection = initSignalR();
        if (connection.state === "Disconnected") {
          console.log("Запуск соединения...");
          await connection.start();
          console.log("SignalR подключен");
        }

        connection.on("ReceiveMessage", (response) => {
          console.log("Получено сообщение:", response);

          // Проверяем, является ли отправитель текущим пользователем
          const isSenderMe =
            response.SenderId === parseInt(localStorage.getItem("id"));

          const messageObj = {
            id: Date.now(),
            text: response.Content,
            sender: isSenderMe ? "me" : "other",
            senderName: localStorage.getItem("name") || "Unknown",
            timestamp: new Date(response.SentAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
            status: "sent",
          };
          setMessages((prev) => [...prev, messageObj]);
        });

        console.log("Загрузка пользователей...");
        const users = await getUsers();
        console.log("Пользователи загружены:", users);
        setChats(users);
      } catch (error) {
        console.error(
          "Ошибка инициализации SignalR или загрузки пользователей:",
          error
        );
        if (
          error.response?.status === 401 ||
          error.message.includes("No token")
        ) {
          navigate("/login");
        }
      }
    };

    setupSignalR();

    return () => {
      // Очистка не требуется, так как соединение управляется глобально
    };
  }, [navigate]);

  // Загрузка истории сообщений при выборе чата
  useEffect(() => {
    if (selectedUserId) {
      const fetchMessages = async () => {
        try {
          const messageData = await getMessages(selectedUserId);
          const formattedMessages = messageData.map((msg) => ({
            id: msg.id,
            text: msg.content,
            sender:
              msg.senderName === localStorage.getItem("name") ? "me" : "other",
            senderName: msg.senderName,
            timestamp: new Date(msg.sentAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
            status: msg.isRead ? "read" : "sent",
          }));
          setMessages(formattedMessages);
        } catch (error) {
          console.error("Ошибка загрузки сообщений:", error);
          if (error.response?.status === 401) {
            navigate("/login");
          }
        }
      };
      fetchMessages();
    }
  }, [selectedUserId, navigate]);

  // Автоскролл к последнему сообщению
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const filteredChats = chats.filter((chat) =>
    chat.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedUserId) {
      alert("Выберите пользователя и введите сообщение");
      return;
    }

    const connection = getConnection();
    if (!connection) {
      console.error("SignalR не подключен");
      alert("Ошибка: соединение с сервером не установлено.");
      return;
    }

    const messageRequest = {
      ReceiverId: parseInt(selectedUserId),
      Content: newMessage,
    };

    try {
      console.log("Отправка сообщения:", messageRequest);
      console.log("Connection state:", connection.state);
      if (connection.state !== "Connected") {
        throw new Error("SignalR connection is not in the 'Connected' state");
      }
      await connection.invoke("SendMessage", messageRequest);

      const newMsg = {
        id: Date.now(),
        text: newMessage,
        sender: "me",
        senderName: localStorage.getItem("name") || "Unknown",
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        status: "sent",
      };

      setMessages((prev) => [...prev, newMsg]);
      setNewMessage("");
    } catch (error) {
      console.error("Ошибка отправки сообщения:", error);
      alert(`Не удалось отправить сообщение: ${error.message}`);
    }
  };

  const handleChatSelect = (chat) => {
    setSelectedChat(chat.username);
    setSelectedUserId(chat.id);
  };

  return (
    <div className="messenger">
      <div className="sidebar">
        <div className="sidebar-header">
          <h2>Чаты</h2>
          <div>
            <button
              onClick={() => navigate("/profile")}
              className="profile-btn"
            >
              Профиль
            </button>
          </div>
        </div>
        <div className="search-container">
          <input
            type="text"
            placeholder="Поиск"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-bar"
          />
          {searchTerm && (
            <button className="clear-search" onClick={() => setSearchTerm("")}>
              ✕
            </button>
          )}
        </div>
        <ul className="chat-list">
          {filteredChats.map((chat) => (
            <li
              key={chat.id}
              className={`chat-item ${
                selectedChat === chat.username ? "selected" : ""
              }`}
              onClick={() => handleChatSelect(chat)}
            >
              <span className="chat-name">{chat.username}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="chat-area">
        {selectedChat ? (
          <>
            <div className="chat-header">
              <h3>{selectedChat}</h3>
              <span className="chat-status">В сети</span>
            </div>
            <div className="messages">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`message ${
                    msg.sender === "me" ? "sent" : "received"
                  }`}
                >
                  <span className="text-sm text-slate-600">
                    {msg.senderName}
                  </span>
                  <div className="p-2 bg-gray-100 rounded-lg shadow-md">
                    <p>{msg.text}</p>
                    <div className="message-meta">
                      <span>{msg.timestamp}</span>
                      {msg.sender === "me" && (
                        <span className="status">
                          {msg.status === "sent" && "✓"}
                          {msg.status === "delivered" && "✓✓"}
                          {msg.status === "read" && (
                            <span className="read">✓✓</span>
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              <span ref={messagesEndRef} />
            </div>
            <div className="message-input">
              <input
                type="text"
                placeholder="Введите сообщение..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
              />
              <button onClick={handleSendMessage}>➤</button>
            </div>
          </>
        ) : (
          <div className="no-chat-message">
            <p>Выберите, кому хотели бы написать</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Messenger;
