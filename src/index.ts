import app from './app.js';

const PORT = process.env.PORT || 8443;

app.listen(PORT, () => {
  console.log(`iLO4 Fan Controller API is running on port ${PORT}`);
});