import React, {
  useState,
  useEffect,
  useRef,
  useContext,
  useMemo,
  useCallback,
} from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  getUsers,
  getMessages,
  initSignalR,
  getConnection,
  markMessagesAsRead,
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
  const [isLoading, setIsLoading] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState({});
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();
  const { logout } = useContext(AuthContext);
  const connectionRef = useRef(null);

  const messageVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  };

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

          const userId = parseInt(sessionStorage.getItem("id"));
          const userName = sessionStorage.getItem("name");
          const isSenderMe =
            response.senderId === userId || response.senderName === userName;
          const isSelfMessage = response.senderId === response.receiverId;

          // Skip adding the message if it's sent by the current user to themselves
          if (isSelfMessage && isSenderMe) {
            console.log(
              "Сообщение от себя к себе, игнорируем в ReceiveMessage"
            );
            return;
          }

          // Skip adding the message if it's sent by the current user and belongs to the current chat
          if (isSenderMe && response.receiverId === parseInt(selectedUserId)) {
            console.log(
              "Сообщение от текущего пользователя в текущем чате, игнорируем"
            );
            return;
          }

          const messageId = generateMessageId(
            response.sentAt,
            response.senderId,
            response.receiverId
          );

          // Update unread count if the message is from another user and not in the selected chat
          if (!isSenderMe && response.senderId !== parseInt(selectedUserId)) {
            setUnreadCounts((prev) => ({
              ...prev,
              [response.senderId]: (prev[response.senderId] || 0) + 1,
            }));
          }

          // Add message to state only if it belongs to the currently selected chat
          if (response.senderId === parseInt(selectedUserId) || isSenderMe) {
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
          }
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
  }, [navigate, selectedUserId]);

  useEffect(() => {
    if (selectedUserId) {
      const fetchMessages = async () => {
        setIsLoading(true);
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

          // Mark messages as read and reset unread count for this user
          try {
            // await markMessagesAsRead(selectedUserId); // Commented out to avoid 404 error
            setUnreadCounts((prev) => ({
              ...prev,
              [selectedUserId]: 0,
            }));
          } catch (error) {
            console.warn(
              "Не удалось пометить сообщения как прочитанные:",
              error
            );
          }
        } catch (error) {
          console.error("Ошибка загрузки сообщений:", error);
          if (error.response?.status === 401) {
            navigate("/login");
          }
        } finally {
          setIsLoading(false);
        }
      };
      fetchMessages();
    }
  }, [selectedUserId, navigate]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const filteredChats = useMemo(() => {
    return chats.filter((chat) =>
      chat.username.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [chats, searchTerm]);

  const handleSendMessage = useCallback(async () => {
    if (!newMessage.trim() || !selectedUserId) {
      alert("Выберите пользователя и введите сообщение");
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

      // Add the sent message to the state for immediate display
      const userId = parseInt(sessionStorage.getItem("id"));
      const userName = sessionStorage.getItem("name");
      const messageId = generateMessageId(
        new Date().toISOString(),
        userId,
        parseInt(selectedUserId)
      );

      setMessages((prev) => [
        ...prev,
        {
          id: messageId,
          text: newMessage,
          sender: "me",
          senderName: userName || "Unknown",
          timestamp: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          status: "sent",
        },
      ]);
      setNewMessage("");
    } catch (error) {
      console.error("Ошибка отправки сообщения:", error);
      alert(
        `Не удалось отправить сообщение: ${
          error.message || "Неизвестная ошибка сервера"
        }`
      );
    }
  }, [newMessage, selectedUserId]);

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
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                }}
              >
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "50%",
                    background: "#d1d5db",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    color: "#ffffff",
                    fontWeight: "bold",
                  }}
                >
                  {chat.username[0].toUpperCase()}
                </div>
                <span className="chat-name">{chat.username}</span>
                {unreadCounts[chat.id] > 0 && (
                  <span className="unread-badge">{unreadCounts[chat.id]}</span>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
      <div className="chat-area">
        {isLoading ? (
          <div className="no-chat-message">
            <p>Загрузка сообщений...</p>
          </div>
        ) : selectedChat ? (
          <>
            <div className="chat-header">
              <h3>{selectedChat}</h3>
              <span className="chat-status">В сети</span>
            </div>
            <div className="messages">
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  className={`message ${
                    msg.sender === "me" ? "sent" : "received"
                  }`}
                  variants={messageVariants}
                  initial="hidden"
                  animate="visible"
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
                </motion.div>
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
