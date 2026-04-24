import apiClient from './apiClient'

export const countryService = {
  getAllCountries: async () => {
    return apiClient.get('/countries')
  },
}
