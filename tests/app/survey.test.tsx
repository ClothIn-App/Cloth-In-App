// tests/app/survey.test.tsx
import React from 'react';
import {
  render as rntlRender,
  fireEvent,
  waitFor,
} from '@testing-library/react-native';

// Use the manual mock file at __mocks__/expo-router.js
jest.mock('expo-router');

// Provide a stable auth uid for the screen
jest.mock('@/src/context/AuthContext', () => ({
  __esModule: true,
  useAuth: () => ({ auth: { user: { uid: 'u_test' } } }),
}));

// Mock the API client and expose handles for assertions
jest.mock('@/src/services/apiClients', () => {
  const setUser = jest.fn().mockResolvedValue({ user: { uid: 'u_test' } });
  return {
    __esModule: true,
    userClient: { setUser },
    __mock: { setUser },
  };
});

// If your Jest config doesn't map image assets, you can uncomment this:
// jest.mock('@/assets/images/login-bg.png', () => 1);

import Survey from '@/app/survey';

// Minimal render (no SafeArea/Gesture wrappers to avoid RN renderer issues)
function render(ui: React.ReactElement) {
  return rntlRender(ui);
}

function startSurvey(screen: ReturnType<typeof render>) {
  const btn = screen.getByText('Start Survey');
  fireEvent.press(btn);
}

describe('Survey screen', () => {
  beforeEach(() => {
    const routerMock = (jest.requireMock('expo-router') as any).__mock;
    routerMock.replace.mockReset();
    routerMock.push.mockReset();

    const apiMock = (jest.requireMock('@/src/services/apiClients') as any).__mock;
    apiMock.setUser.mockReset();
  });

  it('shows intro, starts survey, and can go back to intro', () => {
    const screen = render(<Survey />);

    // Intro visible
    expect(
      screen.getByText("Let's Personalize Your Experience!")
    ).toBeTruthy();
    expect(screen.getByText('Start Survey')).toBeTruthy();

    // Start → first question
    startSurvey(screen);
    expect(
      screen.getByText('What style(s) are you into?')
    ).toBeTruthy();

    // Back → intro
    fireEvent.press(screen.getByText('Back'));
    expect(screen.getByText('Start Survey')).toBeTruthy();
  });

  it('skip survey navigates to /(tabs) without saving', () => {
    const screen = render(<Survey />);

    // Intro: press Skip
    fireEvent.press(screen.getByText('Skip Survey'));

    const routerMock = (jest.requireMock('expo-router') as any).__mock;
    const apiMock = (jest.requireMock('@/src/services/apiClients') as any).__mock;

    expect(apiMock.setUser).not.toHaveBeenCalled();
    expect(routerMock.replace).toHaveBeenCalledWith('../(tabs)');
  });

  it('selects options, adds custom input, saves via setUser, then navigates', async () => {
    const screen = render(<Survey />);

    // Intro → first question
    startSurvey(screen);

    // Q1: select one option
    fireEvent.press(screen.getByText('Masculine'));

    // Q1: add custom input and type text
    fireEvent.press(screen.getByText('+ Add Your Own'));
    const customInput = screen.getByPlaceholderText('Type your answer...');
    fireEvent.changeText(customInput, 'Androgynous');

    // Advance through remaining questions
    fireEvent.press(screen.getByText('Next')); // Q1 → Q2
    fireEvent.press(screen.getByText('Next')); // Q2 → Q3
    fireEvent.press(screen.getByText('Next')); // Q3 → Q4
    fireEvent.press(screen.getByText('Next')); // Q4 → Q5

    // On last question, button shows "Finish"
    expect(screen.getByText('Finish')).toBeTruthy();
    fireEvent.press(screen.getByText('Finish'));

    const apiMock = (jest.requireMock('@/src/services/apiClients') as any).__mock;
    const routerMock = (jest.requireMock('expo-router') as any).__mock;

    // setUser called once with userId and survey payload
    await waitFor(() => {
      expect(apiMock.setUser).toHaveBeenCalledTimes(1);
    });

    const [userIdArg, payloadArg] = apiMock.setUser.mock.calls[0];
    expect(userIdArg).toBe('u_test');
    expect(payloadArg).toHaveProperty('survey');

    const survey = payloadArg.survey;
    expect(Array.isArray(survey.style)).toBe(true);
    expect(survey.style).toEqual(
      expect.arrayContaining(['Masculine', 'Androgynous'])
    );

    // Navigates to tabs after save
    expect(routerMock.replace).toHaveBeenCalledWith('../(tabs)');
  });
});
