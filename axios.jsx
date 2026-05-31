const token = JSON.parse(localStorage.getItem("auth_token"));
const response = await axios.post(
  "http://localhost:8000/api/routine/generate/",
  data,
  {
    headers: {
      Authorization: `Bearer ${token.access}`,
      "Content-Type": "application/json",
    },
  }
);
