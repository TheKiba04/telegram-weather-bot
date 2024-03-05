const axios = require("axios");
const sendRequestToOpenAI = (message) => {
  const url = process.env.OPENAI_REQUEST_URL;
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
  };
  const data = {
    model: "gpt-3.5-turbo",
    messages: [{ role: "user", content: message }],
    temperature: 0.7,
  };
  return axios.post(url, data, { headers }).then((response) => {
    return response.data;
  });
};

const getWeather = (location) => {
  const url = `${process.env.WEATHER_REQUEST_URL}?lat=${location.latitude}&lon=${location.longitude}&appid=${process.env.WEATHER_API_KEY}`;
  return axios.get(url).then((response) => {
    return response.data;
  });
};

const getDailyForecast = async (location) => {
  try {
    const { latitude, longitude } = location;

    const weatherResponse = await getWeather({ latitude, longitude });
    const gptResponse = await sendRequestToOpenAI(
      `Create interesting daily forecast based on this data: ${JSON.stringify(
        weatherResponse
      )}. Convert temperature to Celcius for degrees. Use Ukrainian language.`
    ).then((response) => response.choices[0].message.content);

    return gptResponse;
  } catch (error) {
    console.log(error, "error");
  }
};

const sendDailyForecast = async (chatId, location, bot) => {
  try {
    const { latitude, longitude } = location;

    if (chatId) {
      const forecast = await getDailyForecast(
        chatId,
        { latitude, longitude },
        bot
      );
      bot.sendMessage(chatId, forecast);
    } else {
      console.log("chatId is undefined");
    }
  } catch (error) {
    console.log(error, "sendDailyForecast error");
  }
};

module.exports = {
  getDailyForecast: getDailyForecast,
  sendDailyForecast: sendDailyForecast,
};
