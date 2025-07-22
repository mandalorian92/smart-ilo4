import app from './app';

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`iLO4 Fan Controller API is running on port ${PORT}`);
});