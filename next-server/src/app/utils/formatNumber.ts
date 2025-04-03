type formatNumberProps = {
  count: number;
  type?: 'view' | undefined;
}

export const formatNumber = ({count, type}: formatNumberProps) => {
    if (count >= 100000000) {
      return `${Math.floor(count / 100000000)}억${type === 'view' ? '회' : ''}`;
    } else if (count >= 10000000) {
      return `${Math.floor(count / 10000)}만${type === 'view' ? '회' : ''}`;
    } else if (count >= 1000) {
      return `${Math.floor(count / 1000)}천${type === 'view' ? '회' : ''}`;
    } else {
      return `${count}${type === 'view' ? '회' : ''}`;
    }
};
  