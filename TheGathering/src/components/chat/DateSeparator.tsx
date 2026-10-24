interface DateSeparatorProps {
  date: Date;
}

const DateSeparator = ({ date }: DateSeparatorProps) => {
  const formatDate = (date: Date): string => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const dateStr = date.toDateString();
    const todayStr = today.toDateString();
    const yesterdayStr = yesterday.toDateString();

    if (dateStr === todayStr) {
      return "Hôm nay";
    } else if (dateStr === yesterdayStr) {
      return "Hôm qua";
    } else {
      return date.toLocaleDateString("vi-VN", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    }
  };

  return (
    <div className="flex items-center justify-center my-4 px-4">
      <span className="text-xs font-semibold text-[#747f8d] uppercase tracking-wider whitespace-nowrap">
        {formatDate(date)}
      </span>
    </div>
  );
};

export default DateSeparator;
