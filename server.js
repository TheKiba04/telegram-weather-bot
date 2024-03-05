require("dotenv").config();
const { getDailyForecast, sendDailyForecast } = require("./helpers");
const bot = require("./botInit");
const schedule = require("node-schedule");
const fs = require("fs").promises;
const path = require("path");

let chatId;

const createJsonFileForUserData = async (data) => {
  const jsonIsCreated = async () => {
    try {
      const stats = await fs.stat(path.join(__dirname, "userData.json"));
      if (stats.isFile()) {
        return true;
      }
    } catch (error) {
      if (error.code === "ENOENT") {
        return false;
      } else {
        console.error(error);
        return false;
      }
    }
  };

  if (!(await jsonIsCreated())) {
    const json = JSON.stringify(data);
    try {
      await fs.writeFile(path.join(__dirname, "userData.json"), json, "utf8");
    } catch (error) {
      console.log(error);
    }
  }
};

const addNewUserToUserData = async (data) => {
  const users = await getUserDataFromJson();
  if (!!users) {
    if (users.length === 0) {
      users.push(data);
      try {
        await fs.writeFile(
          path.join(__dirname, "userData.json"),
          JSON.stringify(users),
          "utf8"
        );
      } catch (error) {
        console.log(error);
      }
    } else {
      const user = users.find((user) => user.chatId === data.chatId);
      if (!user) {
        users.push(data);

        try {
          await fs.writeFile(
            path.join(__dirname, "userData.json"),
            JSON.stringify(users),
            "utf8"
          );
        } catch (error) {
          console.log(error);
        }
      } else {
        console.log("User already exists");
      }
    }
  }
};

const updateUserLocation = async (chatId, location) => {
  const users = await getUserDataFromJson();

  //find user by chatId with for loop
  for (let i = 0; i < users.length; i++) {
    if (users[i].chatId === chatId) {
      users[i].location = location;
    }
  }
  //update user in json file
  try {
    await fs.writeFile(
      path.join(__dirname, "userData.json"),
      JSON.stringify(users),
      "utf8"
    );
  } catch (error) {
    console.log(error);
  }
};

const getUserDataFromJson = async () => {
  try {
    const data = await fs.readFile(
      path.join(__dirname, "userData.json"),
      "utf8"
    );
    const users = JSON.parse(data);
    return users;
  } catch (error) {
    console.log(error);
  }
};

bot.onText(/\/start/, async (msg) => {
  await createJsonFileForUserData([]);

  chatId = msg.chat.id;
  bot.sendMessage(chatId, "Welcome to the weather bot");

  await addNewUserToUserData({
    chatId: chatId,
    location: { latitude: 0, longitude: 0 },
    userName: msg.chat.username,
    firstName: msg.chat.first_name,
    lastName: msg.chat.last_name,
    languageCode: msg.from.language_code,
    isBot: msg.from.is_bot,
  });

  const opts = {
    reply_markup: JSON.stringify({
      keyboard: [[{ text: "Location", request_location: true }]],
      resize_keyboard: true,
      one_time_keyboard: true,
    }),
  };
  bot.sendMessage(chatId, "Select location for weather forecasts", opts);

  bot.on("location", async (msg) => {
    console.table([
      { lat: msg.location.latitude, lon: msg.location.longitude },
    ]);

    await updateUserLocation(msg.chat.id, {
      latitude: msg.location.latitude,
      longitude: msg.location.longitude,
    });

    const userData = await getUserDataFromJson();

    for (let i = 0; i < userData.length; i++) {
      schedule.scheduleJob("15 21 * * *", async () => {
        bot.sendMessage(userData[i].chatId, "Forecast:");
        await sendDailyForecast(userData[i].chatId, userData[i].location, bot);
      });
    }
  });

  // Listen on the 'polling_error' event
  bot.on("polling_error", (error) => {
    var time = new Date();
    console.log("TIME: ", time);
    console.log("POLL_CODE: ", error.code); // => 'EFATAL'
    console.log("MSG: ", error.message);
    console.log("STACK: ", error.stack);
  });

  bot.on("uncaughtException", (error) => {
    var time = new Date();
    console.log("TIME: ", time);
    console.log("NODE_CODE: ", error.code); // => 'NODE JS'
    console.log("MSG: ", error.message);
    console.log("STACK: ", error.stack);
  });

  // Listen on the 'webhook_error' event
  bot.on("webhook_error", (error) => {
    var time = new Date();
    console.log("TIME: ", time);
    console.log("WEB_CODE: ", error.code); // => 'EPARSE'
    console.log("MSG: ", error.message);
    console.log("STACK: ", error.stack);
  });
});
