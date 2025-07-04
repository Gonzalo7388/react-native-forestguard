jest.mock('expo-constants', () => ({
  manifest: {
    extra: {
      eas: {
        projectId: 'mock-project-id',
      },
    },
  },
}));

jest.mock('expo', () => ({
  Constants: {
    manifest: {
      name: 'MockApp',
    },
  },
}));

jest.mock('react-native-chart-kit', () => ({
  LineChart: () => null,
}));

jest.mock('react-native-paper', () => {
  const React = require('react');
  return {
    Card: ({ children }) => <>{children}</>,
  };
});

jest.mock('./src/components/Header', () => 'MockedHeader');