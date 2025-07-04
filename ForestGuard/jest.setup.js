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

jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(),
}));
jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(),
  collection: jest.fn(),
  addDoc: jest.fn(),
  setDoc: jest.fn(),
  doc: jest.fn(),
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