import api from './api.js'

export const chatbotService = {
  /**
   * Send a user query to the K-Drama AI assistant.
   * @param {string} message - User query (2 - 500 characters)
   * @returns {Promise<string>} - AI response reply text
   */
  async sendMessage(message) {
    const trimmed = (message || '').trim()

    try {
      const response = await api.post('/discover/chatbot', {
        message: trimmed,
      })

      // Backend returns { reply: "..." }
      if (response.data && typeof response.data.reply === 'string') {
        return response.data.reply
      }

      if (typeof response.data === 'string') {
        return response.data
      }

      return 'Annyeong! I received your message, but no response was generated. Please try again.'
    } catch (error) {
      // Map API errors according to the team contract
      if (error.response) {
        const { status, data } = error.response

        if (status === 401) {
          throw new Error('Your session has expired. Please log in again to chat with the AI assistant.')
        }

        if (status === 422) {
          const detail = data?.message || data?.errors?.message?.[0] || 'Please enter a message between 2 and 500 characters.'
          throw new Error(detail)
        }

        if (status === 429) {
          throw new Error("You're asking too quickly. Please wait a moment.")
        }

        if (data?.message) {
          throw new Error(data.message)
        }
      }

      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        throw new Error("Sorry, the AI assistant took too long to respond. Please try again.")
      }

      throw new Error("Sorry, I couldn't connect to the AI assistant right now. Please try again.")
    }
  },
}

export default chatbotService

