import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import axios from "axios";
import Notification from "./Notification";

function Messages() {
  const { userId } = useParams();
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [recipient, setRecipient] = useState(`User ${userId}`);
  const [recipientProfileImage, setRecipientProfileImage] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editDraft, setEditDraft] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [sending, setSending] = useState(false);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(false);
  const [notification, setNotification] = useState(null);
  const [hasConnection, setHasConnection] = useState(true);
  const messagesEndRef = useRef(null);
  const previousMessageCountRef = useRef(0);
  const previousMessagesRef = useRef([]);
  const recipientRef = useRef(`User ${userId}`);
  const scrollContainerRef = useRef(null);
  const isInitialLoadRef = useRef(true);
  const lastNotifiedMessageIdRef = useRef(null);
  const latestMessageIdRef = useRef(null);
  const isNearBottomRef = useRef(true);
  const pollCycleRef = useRef(0);

  const getCsrfToken = async () => {
    const response = await axios.get("/api/csrf/", { withCredentials: true });
    return response.data.csrfToken;
  };

  const messagesEqual = (oldMessages, newMessages) => {
    if (oldMessages.length !== newMessages.length) return false;
    for (let i = 0; i < oldMessages.length; i++) {
      const oldMsg = oldMessages[i];
      const newMsg = newMessages[i];
      if (
        oldMsg.id !== newMsg.id ||
        oldMsg.content !== newMsg.content ||
        oldMsg.edited_at !== newMsg.edited_at ||
        oldMsg.created_at !== newMsg.created_at
      ) {
        return false;
      }
    }
    return true;
  };

  const playNotificationSound = () => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 800;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
  };

  const checkScrollPosition = () => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const threshold = 100;
    const distanceToBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    isNearBottomRef.current = distanceToBottom <= threshold;
  };

  useEffect(() => {
    const loadCurrentUser = async () => {
      try {
        const response = await axios.get("/api/me/", {
          withCredentials: true,
        });
        setCurrentUser(response.data.user);
      } catch (err) {
      }
    };

    loadCurrentUser();
  }, []);

  useEffect(() => {
    isInitialLoadRef.current = true;
    recipientRef.current = `User ${userId}`;
    setMessages([]);
    setRecipientProfileImage(null);
    setLoading(true);
    setError("");
    latestMessageIdRef.current = null;

    const fetchRecipientInfo = async () => {
      try {
        const response = await axios.get(`/api/connections/`, {
          withCredentials: true,
        });
        const connections = response.data.connections || [];
        const connection = connections.find(c => c.other_user_id === Number(userId));
        if (connection) {
          const fullName = (connection.first_name || connection.last_name)
            ? `${connection.first_name} ${connection.last_name}`.trim()
            : connection.other_username;
          const resolvedRecipient = fullName || `User ${userId}`;
          setRecipient(resolvedRecipient);
          recipientRef.current = resolvedRecipient;
          const imageUrl = connection.profile_image
            ? connection.profile_image.startsWith("http")
              ? connection.profile_image
              : connection.profile_image.startsWith("/media/")
              ? `${window.API_BASE_URL}${connection.profile_image}`
              : connection.profile_image
            : null;
          setRecipientProfileImage(imageUrl);
        }
      } catch (err) {
      }
    };

    const fetchMessages = async () => {
      if (!userId || editingMessageId !== null) {
        return;
      }

      try {
        const isInitialLoad = isInitialLoadRef.current;
        const latestId = latestMessageIdRef.current;
        pollCycleRef.current = (pollCycleRef.current + 1) % 2;

        const shouldFetchFull = isInitialLoad || pollCycleRef.current === 0;
        const url = latestId && !shouldFetchFull
          ? `/api/messages/${userId}/?after=${latestId}`
          : `/api/messages/${userId}/`;

        const response = await axios.get(url, {
          withCredentials: true,
        });
        const responseData = response.data;
        const newMessages = responseData.messages || [];
        const connectionStatus = responseData.has_connection !== undefined ? responseData.has_connection : true;

        setHasConnection(connectionStatus);

        if (isInitialLoad || shouldFetchFull) {
          setMessages(newMessages);
          previousMessagesRef.current = newMessages;
          previousMessageCountRef.current = newMessages.length;
          if (isInitialLoad) {
            setLoading(false);
            isInitialLoadRef.current = false;
          }

          if (newMessages.length > 0) {
            const first = newMessages[0];
            const isOtherSender = first.sender_id === Number(userId);
            const firstName = isOtherSender ? first.sender_first_name : first.receiver_first_name;
            const lastName = isOtherSender ? first.sender_last_name : first.receiver_last_name;
            const username = isOtherSender ? first.sender_username : first.receiver_username;
            const profileImage = isOtherSender ? first.sender_profile_image : first.receiver_profile_image;

            const fullName = (firstName || lastName) ? `${firstName} ${lastName}`.trim() : username;
            const resolvedRecipient = fullName || `User ${userId}`;
            setRecipient(resolvedRecipient);
            recipientRef.current = resolvedRecipient;
            if (profileImage && !recipientProfileImage) {
              const imageUrl = profileImage.startsWith("http")
                ? profileImage
                : profileImage.startsWith("/media/")
                ? `${window.API_BASE_URL}${profileImage}`
                : profileImage;
              setRecipientProfileImage(imageUrl);
            }
            latestMessageIdRef.current = newMessages[newMessages.length - 1].id;
          }
        } else if (newMessages.length > 0) {
          const currentMessages = previousMessagesRef.current;
          const mergedMessages = [...currentMessages];
          let hasNewIncoming = false;

          newMessages.forEach(newMsg => {
            const existingIndex = mergedMessages.findIndex(m => m.id === newMsg.id);
            if (existingIndex >= 0) {
              mergedMessages[existingIndex] = newMsg;
            } else {
              mergedMessages.push(newMsg);
              if (newMsg.sender_id !== currentUser?.id) {
                hasNewIncoming = true;
              }
            }
          });

          if (hasNewIncoming) {
            const latestNewMsg = newMessages[newMessages.length - 1];
            if (latestNewMsg.id !== lastNotifiedMessageIdRef.current) {
              const senderName = (latestNewMsg.sender_first_name || latestNewMsg.sender_last_name)
                ? `${latestNewMsg.sender_first_name} ${latestNewMsg.sender_last_name}`.trim()
                : latestNewMsg.sender_username;
              setNotification(`🔔 New message from ${senderName}`);
              lastNotifiedMessageIdRef.current = latestNewMsg.id;
              playNotificationSound();
              window.dispatchEvent(new CustomEvent('newMessageNotification', {
                detail: { message: `🔔 New message from ${senderName}` }
              }));
            }

            if (isNearBottomRef.current) {
              setShouldAutoScroll(true);
            }
          }

          previousMessagesRef.current = mergedMessages;
          previousMessageCountRef.current = mergedMessages.length;
          setMessages(mergedMessages);
          latestMessageIdRef.current = mergedMessages[mergedMessages.length - 1].id;
        }

        window.dispatchEvent(new CustomEvent('unreadCountUpdated'));
      } catch (err) {
        if (isInitialLoadRef.current) {
          setError(
            err.response?.data?.error ||
              err.response?.data?.message ||
              "Unable to load messages."
          );
          setLoading(false);
          isInitialLoadRef.current = false;
        }
      }
    };

    fetchRecipientInfo();
    fetchMessages();
    const poll = setInterval(fetchMessages, 3000);
    return () => clearInterval(poll);
  }, [userId]);

  useEffect(() => {
    if (shouldAutoScroll) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      setShouldAutoScroll(false);
    }
  }, [shouldAutoScroll]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      checkScrollPosition();
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSend = async (event) => {
    event.preventDefault();
    if (!draft.trim()) {
      setError("Please enter a message before sending.");
      return;
    }

    setSending(true);
    try {
      setError("");
      const csrfToken = await getCsrfToken();
      const response = await axios.post(`/api/messages/send/${userId}/`, {
        content: draft,
      }, {
        withCredentials: true,
        headers: { "X-CSRFToken": csrfToken },
      });

      setMessages((prev) => {
        const newMessages = [...prev, response.data];
        previousMessagesRef.current = newMessages;
        previousMessageCountRef.current = newMessages.length;
        return newMessages;
      });
      setShouldAutoScroll(true);
      setDraft("");
    } catch (err) {
      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Unable to send message."
      );
    } finally {
      setSending(false);
    }
  };

  const deleteMessage = async (messageId) => {
    if (!window.confirm("Delete this message?")) {
      return;
    }

    try {
      const csrfToken = await getCsrfToken();
      await axios.delete(`/api/messages/delete/${messageId}/`, {
        withCredentials: true,
        headers: { "X-CSRFToken": csrfToken },
      });
      setMessages((prev) => {
        const newMessages = prev.filter((message) => message.id !== messageId);
        previousMessagesRef.current = newMessages;
        previousMessageCountRef.current = newMessages.length;
        return newMessages;
      });
      if (editingMessageId === messageId) {
        setEditingMessageId(null);
        setEditDraft("");
      }
    } catch (err) {
      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Unable to delete message."
      );
    }
  };

  const startEditing = (message) => {
    setEditingMessageId(message.id);
    setEditDraft(message.content);
  };

  const cancelEditing = () => {
    setEditingMessageId(null);
    setEditDraft("");
  };

  const saveEdit = async (messageId) => {
    if (!editDraft.trim()) {
      setError("Message cannot be empty.");
      return;
    }

    setSavingEdit(true);
    try {
      const csrfToken = await getCsrfToken();
      const response = await axios.put(
        `/api/messages/edit/${messageId}/`,
        { content: editDraft },
        { withCredentials: true, headers: { "X-CSRFToken": csrfToken } }
      );

      setMessages((prev) => {
        const newMessages = prev.map((message) =>
          message.id === messageId ? response.data : message
        );
        previousMessagesRef.current = newMessages;
        return newMessages;
      });
      setEditingMessageId(null);
      setEditDraft("");
    } catch (err) {
      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Unable to save changes."
      );
    } finally {
      setSavingEdit(false);
    }
  };

  const renderMessage = (message) => {
    const isSent = currentUser
      ? message.sender_id === currentUser.id
      : message.sender_id !== Number(userId);
    const isEditing = editingMessageId === message.id;

    return (
      <div
        key={message.id}
        className={`message-row ${isSent ? "sent" : "received"}`}
      >
        <div className="message-bubble">
          {isEditing ? (
            <>
              <textarea
                className="input"
                value={editDraft}
                onChange={(event) => setEditDraft(event.target.value)}
              />
              <div className="message-actions-inline">
                <button
                  type="button"
                  className="button button-primary"
                  disabled={savingEdit || !editDraft.trim()}
                  onClick={() => saveEdit(message.id)}
                >
                  Save
                </button>
                <button
                  type="button"
                  className="button button-secondary"
                  onClick={cancelEditing}
                >
                  Cancel
                </button>
              </div>
            </>
          ) : (
            <>
              <p>{message.content}</p>
              <div className="message-meta">
                <span>{new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                <span>{message.sender_username}</span>
              </div>
              <div className="message-details">
                {message.is_edited && <span className="message-edited">Edited</span>}
                {isSent && (
                  <span className="message-status">
                    {message.is_read ? "Read" : "Delivered"}
                  </span>
                )}
              </div>
            </>
          )}
        </div>

        {!isEditing && isSent && (
          <div className="message-actions">
            <button
              type="button"
              className="message-action"
              onClick={() => startEditing(message)}
              title="Edit message"
            >
              ✏
            </button>
            <button
              type="button"
              className="message-action"
              onClick={() => deleteMessage(message.id)}
              title="Delete message"
            >
              🗑
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {notification && (
        <Notification
          message={notification}
          type="info"
          duration={4000}
        />
      )}
      <div className="page-card">
        <div className="page-card-header">
          <h1 className="page-heading">Messages</h1>
          <div className="message-recipient">
            <div className="avatar avatar-small">
              {recipientProfileImage ? (
                <img src={recipientProfileImage} alt={recipient} />
              ) : (
                <div className="placeholder-avatar">
                  {recipient.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <p className="page-subtitle">
              Chat with <strong>{recipient}</strong>.
            </p>
          </div>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="page-card">
          <h2>Loading messages...</h2>
        </div>
      ) : (
        <>
          <div className="message-list" ref={scrollContainerRef}>
            {messages.length === 0 ? (
              <p>No messages yet. Send the first message to start the conversation.</p>
            ) : (
              messages.map(renderMessage)
            )}
            <div ref={messagesEndRef} />
          </div>

          {!hasConnection ? (
            <div className="message-form disabled">
              <div className="connection-removed-notice">
                This connection has been removed. Messaging is disabled.
              </div>
              <div className="actions">
                <Link className="button button-secondary" to="/connections">
                  Back to Connections
                </Link>
              </div>
            </div>
          ) : (
            <form className="message-form" onSubmit={handleSend}>
              <textarea
                className="input"
                value={draft}
                placeholder={`Write a message to ${recipient}...`}
                onChange={(event) => setDraft(event.target.value)}
              />
              <div className="actions">
                <button
                  type="submit"
                  className="button button-primary"
                  disabled={sending || !draft.trim()}
                >
                  {sending ? "Sending..." : "Send Message"}
                </button>
                <Link className="button button-secondary" to="/connections">
                  Back to Connections
                </Link>
              </div>
            </form>
          )}
        </>
      )}
    </div>
    </>
  );
}

export default Messages;
