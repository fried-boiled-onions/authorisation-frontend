import React, { useState, useEffect, useRef, useContext } from "react";
import { useNavigate } from "react-router-dom";
import {
  getUsers,
  getMessages,
  initSignalR,
  getConnection,
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
  const connectionRef = useRef(null);

  const generateMessageId = (sentAt, senderId, receiverId) => {
    const random = Math.random().toString(36).substring(2, 8);
    return `${sentAt}-${senderId}-${receiverId}-${random}`;
  };

  useEffect(() => {
    let mounted = true;

    const setupSignalR = async () => {
      try {
        console.log("Инициализация SignalR...");
        const connection = initSignalR();
        connectionRef.current = connection;

        if (connection.state === "Disconnected") {
          console.log("Запуск соединения...");
          await connection.start();
          console.log("SignalR подключён");
        }

        const handleReceiveMessage = (response) => {
          if (!mounted) return;
          if (!response || !response.content) {
            console.log(
              "Получено пустое или некорректное сообщение, игнорируем"
            );
            return;
          }
          console.log("Получено сообщение:", response);
          console.log(
            "response.senderId:",
            response.senderId,
            "type:",
            typeof response.senderId
          );
          console.log(
            "sessionStorage.id:",
            sessionStorage.getItem("id"),
            "parsed:",
            parseInt(sessionStorage.getItem("id")),
            "type:",
            typeof parseInt(sessionStorage.getItem("id"))
          );
          console.log(
            "response.senderName:",
            response.senderName,
            "sessionStorage.name:",
            sessionStorage.getItem("name")
          );

          const userId = parseInt(sessionStorage.getItem("id"));
          const userName = sessionStorage.getItem("name");
          const isSenderMe =
            response.senderId === userId || response.senderName === userName;
          console.log("isSenderMe:", isSenderMe);

          const messageId = generateMessageId(
            response.sentAt,
            response.senderId,
            response.receiverId
          );

          setMessages((prev) => {
            if (prev.some((msg) => msg.id === messageId)) {
              console.log("Сообщение уже добавлено, игнорируем");
              return prev;
            }
            return [
              ...prev,
              {
                id: messageId,
                text: response.content,
                sender: isSenderMe ? "me" : "other",
                senderName:
                  response.senderName ||
                  (isSenderMe
                    ? userName || "Unknown"
                    : `User${response.senderId}`),
                timestamp: new Date(response.sentAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                }),
                status: isSenderMe ? "sent" : "received",
              },
            ];
          });
        };

        connection.on("ReceiveMessage", handleReceiveMessage);

        console.log("Загрузка пользователей...");
        const users = await getUsers();
        if (mounted) {
          console.log("Пользователи загружены:", users);
          setChats(users);
        }

        return () => {
          if (connectionRef.current) {
            connectionRef.current.off("ReceiveMessage", handleReceiveMessage);
            console.log("Очищен обработчик");
          }
        };
      } catch (error) {
        console.error(
          "Ошибка инициализации SignalR или загрузки пользователей:",
          error
        );
        if (
          error.response?.status === 401 ||
          error.message.includes("text/html")
        ) {
          navigate("/login");
        }
      }
    };

    setupSignalR();

    return () => {
      mounted = false;
      if (connectionRef.current) {
        connectionRef.current.off("ReceiveMessage");
        console.log("Очищено соединение SignalR");
      }
    };
  }, [navigate]);

  useEffect(() => {
    if (selectedUserId) {
      const fetchMessages = async () => {
        try {
          const messageData = await getMessages(selectedUserId);
          const formattedMessages = messageData.map((msg) => ({
            id: generateMessageId(msg.sentAt, msg.senderId, msg.receiverId),
            text: msg.content,
            sender:
              msg.senderName === sessionStorage.getItem("name")
                ? "me"
                : "other",
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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const filteredChats = chats.filter((chat) =>
    chat.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedUserId) {
      alert("Выберите пользователя иное сообщение");
      return;
    }

    const connection = getConnection();
    if (!connection || connection.state !== "Connected") {
      console.error("SignalR не подключён");
      alert("Ошибка: соединение с сервером не установлено.");
      return;
    }

    const messageRequest = {
      ReceiverId: parseInt(selectedUserId),
      Content: newMessage,
    };

    try {
      console.log("Отправка сообщения:", messageRequest);
      await connection.invoke("SendMessage", messageRequest);
      console.log("Сообщение отправлено через SignalR");
      setNewMessage("");
    } catch (error) {
      console.error("Ошибка отправки сообщения:", error);
      alert(
        `Не удалось отправить сообщение: ${
          error.message || "Неизвестная ошибка сервера"
        }`
      );
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
                  <span className="text-sm text-slate-600 font-bold">
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
