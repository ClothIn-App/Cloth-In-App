// tests/app/survey.test.tsx
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';

// Testing the PURE screen avoids Expo Winter entirely
import SurveyScreen from '@/src/screens/SurveyScreen';

function startSurvey(screen: ReturnType<typeof render>) {
  fireEvent.press(screen.getByText('Start Survey'));
}

describe('SurveyScreen (pure)', () => {
  it('shows intro, starts survey, and can go back to intro', () => {
    const onSkip = jest.fn();
    const onSubmit = jest.fn();

    const screen = render(<SurveyScreen onSkip={onSkip} onSubmit={onSubmit} />);

    expect(
      screen.getByText("Let's Personalize Your Experience!")
    ).toBeTruthy();
    expect(screen.getByText('Start Survey')).toBeTruthy();

    startSurvey(screen);
    expect(screen.getByText('What style(s) are you into?')).toBeTruthy();

    fireEvent.press(screen.getByText('Back'));
    expect(screen.getByText('Start Survey')).toBeTruthy();
    expect(onSkip).not.toHaveBeenCalled();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('skip survey calls onSkip without saving', () => {
    const onSkip = jest.fn();
    const onSubmit = jest.fn();

    const screen = render(<SurveyScreen onSkip={onSkip} onSubmit={onSubmit} />);
    fireEvent.press(screen.getByText('Skip Survey'));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(onSkip).toHaveBeenCalledTimes(1);
  });

  it('selects options, adds custom input, calls onSubmit with final responses', async () => {
    const onSkip = jest.fn();
    const onSubmit = jest.fn();

    const screen = render(<SurveyScreen onSkip={onSkip} onSubmit={onSubmit} />);

    startSurvey(screen);

    fireEvent.press(screen.getByText('Masculine'));
    fireEvent.press(screen.getByText('+ Add Your Own'));
    const custom = screen.getByPlaceholderText('Type your answer...');
    fireEvent.changeText(custom, 'Androgynous');

    fireEvent.press(screen.getByText('Next')); // Q1 → Q2
    fireEvent.press(screen.getByText('Next')); // Q2 → Q3
    fireEvent.press(screen.getByText('Next')); // Q3 → Q4
    fireEvent.press(screen.getByText('Next')); // Q4 → Q5

    expect(screen.getByText('Finish')).toBeTruthy();
    fireEvent.press(screen.getByText('Finish'));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));

    const [finalResponses] = onSubmit.mock.calls[0];
    expect(finalResponses.style).toEqual(
      expect.arrayContaining(['Masculine', 'Androgynous'])
    );
    expect(onSkip).not.toHaveBeenCalled();
  });
});
