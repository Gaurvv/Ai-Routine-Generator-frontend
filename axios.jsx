const token = JSON.parse(localStorage.getItem("auth_token"));
const response = await axios.post(
  "https://routiney-generator.netlify.app//api/routine/generate/",
  data,
  {
    headers: {
      Authorization: `Bearer ${token.access}`,
      "Content-Type": "application/json",
    },
  }
);
