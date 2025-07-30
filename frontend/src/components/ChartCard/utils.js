export const pad2 = n => n.toString().padStart(2, '0');
export const getTimeLabel = date => `${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
export const apiTimestamp = (date) => {
  const d = new Date(date);
  d.setSeconds(0,0);
  return Math.floor(d.getTime() / 1000);
};
export const getInitialNow = () => {
  const now = new Date();
  if (now.getSeconds() < 5) {
    now.setMinutes(now.getMinutes() - 1);
  }
  return now;
};