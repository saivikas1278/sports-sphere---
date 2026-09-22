import api from './api';

const contactService = {
  // Send contact form
  sendContactForm: async (contactData) => {
    try {
      console.log('Sending contact form data:', contactData);
      const response = await api.post('/contact', contactData);
      console.log('Contact service response:', response);
      // api.js interceptor already returns response.data, so response is the actual data
      return response;
    } catch (error) {
      console.error('Contact service error:', error);
      // Extract validation errors if they exist
      if (error.response?.data?.errors) {
        const customError = new Error(error.response.data.message || 'Validation failed');
        customError.errors = error.response.data.errors;
        throw customError;
      }
      const finalError = new Error(error.response?.data?.message || error.message || 'Failed to send message');
      throw finalError;
    }
  },

  // Get contact information
  getContactInfo: async () => {
    try {
      const response = await api.get('/contact/info');
      // api.js interceptor already returns response.data, so response is the actual data
      return response;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to get contact info');
    }
  }
};

export default contactService;
