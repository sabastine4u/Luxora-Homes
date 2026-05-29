import { useEffect, useMemo, useRef, useState } from 'react'
import Icon from '../common/Icon'

const messageTime = (item = {}) => item.createdAt || item.timestamp || new Date().toISOString()
const latestMessageTime = (conversation = {}) => {
  const latestReply = [...(conversation.replies || [])].sort((a, b) => new Date(messageTime(b)) - new Date(messageTime(a)))[0]
  return messageTime(latestReply || conversation)
}

const participantName = (message, variant) => {
  if (variant === 'agent') return message.seekerName || message.name || message.email || 'Property seeker'
  return message.agent || message.owner || 'Luxora agent'
}

const isUserConversation = (message, user) => {
  if (!user) return false
  if (message.seekerId || message.userId) return message.seekerId === user.id || message.userId === user.id
  if (message.seekerEmail || message.email) return message.seekerEmail === user.email || message.email === user.email
  return Boolean(
    message.seekerId === user.id
    || message.userId === user.id
    || message.seekerEmail === user.email
    || message.email === user.email
  )
}

const agentIdsForUser = (user = {}) => [
  user.id,
  user.agentId,
  user.agentProfileId,
  ...(user.agentProfileIds || []),
].filter(Boolean)

const isAgentConversation = (message, user) => {
  if (!user) return false
  const stableIds = agentIdsForUser(user)
  const messageAgentIds = [message.agentUserId, message.ownerId, message.agentId, message.ownerAgentId].filter(Boolean)
  if (messageAgentIds.length && stableIds.some((id) => messageAgentIds.includes(id))) return true
  return !messageAgentIds.length && message.copiedToAgentId === user.id
}

const buildThread = (conversation, variant) => {
  if (!conversation) return []
  const firstMessage = {
    id: `${conversation.id}-initial`,
    message: conversation.message,
    sender: conversation.seekerName || conversation.name || 'Property seeker',
    senderRole: 'user',
    createdAt: messageTime(conversation),
  }
  const replies = (conversation.replies || []).map((reply) => ({
    ...reply,
    senderRole: reply.senderRole || 'agent',
  }))
  return [firstMessage, ...replies]
    .filter((item) => item.message)
    .sort((a, b) => new Date(messageTime(a)) - new Date(messageTime(b)))
    .map((item) => ({
      ...item,
      isOwn: item.senderRole === variant,
    }))
}

export default function MessagesPanel({ messages = [], variant, user, addMessageReply }) {
  const [activeId, setActiveId] = useState('')
  const [draft, setDraft] = useState('')
  const threadRef = useRef(null)

  const conversations = useMemo(() => {
    const visibleMessages = messages.filter((message) => (
      variant === 'agent' ? isAgentConversation(message, user) : isUserConversation(message, user)
    ))
    return [...visibleMessages].sort((a, b) => new Date(latestMessageTime(b)) - new Date(latestMessageTime(a)))
  }, [messages, user, variant])

  const selectedId = conversations.some((message) => message.id === activeId) ? activeId : conversations[0]?.id
  const activeConversation = conversations.find((message) => message.id === selectedId) || null
  const thread = useMemo(() => buildThread(activeConversation, variant), [activeConversation, variant])

  useEffect(() => {
    const node = threadRef.current
    if (node) node.scrollTop = node.scrollHeight
  }, [thread.length, activeConversation?.id])

  const handleSend = (event) => {
    event.preventDefault()
    const message = draft.trim()
    if (!message || !activeConversation) return
    addMessageReply(activeConversation.id, {
      message,
      status: variant === 'agent' ? 'Contacted' : activeConversation.status,
      sender: user?.name || (variant === 'agent' ? 'Luxora Agent' : 'Property seeker'),
      senderId: user?.id,
      senderRole: variant,
    })
    setDraft('')
  }

  if (!conversations.length) {
    return (
      <div className="dashboard-grid messages-dashboard-grid">
        <article className="dashboard-panel wide-panel">
          <div className="empty-state">
            <h2>No messages yet</h2>
            <p>New property conversations will appear here.</p>
          </div>
        </article>
      </div>
    )
  }

  return (
    <div className="dashboard-grid messages-dashboard-grid">
      <article className="dashboard-panel wide-panel messages-panel">
        <div className="panel-heading">
          <h2>Messages</h2>
        </div>
        <div className="messages-layout">
          <div className="conversation-list" aria-label="Conversations">
            {conversations.map((conversation) => {
              const isActive = conversation.id === activeConversation?.id
              const latestReply = [...(conversation.replies || [])].sort((a, b) => new Date(messageTime(b)) - new Date(messageTime(a)))[0]
              return (
                <button className={isActive ? 'is-active' : ''} type="button" onClick={() => setActiveId(conversation.id)} key={conversation.id}>
                  <span><Icon name="message" /></span>
                  <div>
                    <strong>{participantName(conversation, variant)}</strong>
                    <p>{conversation.propertyTitle || conversation.propertyReference || conversation.propertyId}</p>
                    <small>{latestReply?.message || conversation.message}</small>
                  </div>
                  {!conversation.isRead && <em>New</em>}
                </button>
              )
            })}
          </div>
          <section className="chat-thread" aria-label="Active conversation">
            <div className="chat-heading">
              <div>
                <h3>{participantName(activeConversation, variant)}</h3>
                <p>{activeConversation.propertyTitle || activeConversation.propertyReference || activeConversation.propertyId}</p>
              </div>
              <span>{activeConversation.status || 'Open'}</span>
            </div>
            <div className="chat-messages" ref={threadRef}>
              {thread.map((item) => (
                <div className={`chat-bubble ${item.isOwn ? 'is-own' : ''}`} key={item.id}>
                  <strong>{item.sender || (item.isOwn ? user?.name : participantName(activeConversation, variant))}</strong>
                  <p>{item.message}</p>
                  <small>{new Date(messageTime(item)).toLocaleString()}</small>
                </div>
              ))}
            </div>
            <form className="chat-composer" onSubmit={handleSend}>
              <input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Write a reply" aria-label="Write a reply" />
              <button className="btn btn-primary" type="submit" disabled={!draft.trim()}>Send</button>
            </form>
          </section>
        </div>
      </article>
    </div>
  )
}
