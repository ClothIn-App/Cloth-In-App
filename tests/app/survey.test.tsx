// tests/app/survey.test.tsx
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';

// Testing the PURE screen avoids Expo Winter entirely
import SurveyScreen from '@/src/screens/SurveyScreen';

jest.mock('@/src/services/apiClients/contentClient', () => ({
  contentApiClient: {
    getTrendingBrands: jest.fn().mockResolvedValue({ brands: [] }),
    searchBrands: jest.fn().mockResolvedValue({ brands: [] }),
  },
}));

const mockOnFetchBrands = jest.fn().mockResolvedValue([]);

function startSurvey(screen: ReturnType<typeof render>) {
  fireEvent.press(screen.getByText('Get Started'));
}

describe('SurveyScreen (pure)', () => {
  beforeEach(() => {
    mockOnFetchBrands.mockClear();
    mockOnFetchBrands.mockResolvedValue([]);
  });

  it('shows intro, starts survey, and can go back to intro', () => {
    const onSkip = jest.fn();
    const onSubmit = jest.fn();

    const screen = render(
      <SurveyScreen onSkip={onSkip} onSubmit={onSubmit} onFetchBrands={mockOnFetchBrands} />
    );

    expect(screen.getByText("Let's build your style profile.")).toBeTruthy();
    expect(screen.getByText('Get Started')).toBeTruthy();

    startSurvey(screen);
    expect(screen.getByText('What style(s) are you into?')).toBeTruthy();

    fireEvent.press(screen.getByText('Back'));
    expect(screen.getByText('Get Started')).toBeTruthy();
    expect(onSkip).not.toHaveBeenCalled();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('skip survey calls onSkip without saving', () => {
    const onSkip = jest.fn();
    const onSubmit = jest.fn();

    const screen = render(
      <SurveyScreen onSkip={onSkip} onSubmit={onSubmit} onFetchBrands={mockOnFetchBrands} />
    );
    fireEvent.press(screen.getByText('Skip for now'));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(onSkip).toHaveBeenCalledTimes(1);
  });

  it('selects options through price step and reaches brand step', async () => {
    const onSkip = jest.fn();
    const onSubmit = jest.fn();

    const screen = render(
      <SurveyScreen onSkip={onSkip} onSubmit={onSubmit} onFetchBrands={mockOnFetchBrands} />
    );

    startSurvey(screen);

    fireEvent.press(screen.getByText('Masculine'));
    fireEvent.press(screen.getByText('Next'));

    fireEvent.press(screen.getByText('Minimalist'));
    fireEvent.press(screen.getByText('Next'));

    fireEvent.press(screen.getByText('Tops'));
    fireEvent.press(screen.getByText('Next'));

    fireEvent.press(screen.getByText('Weekend'));
    fireEvent.press(screen.getByText('Next'));

    fireEvent.press(screen.getByText('Mid-Range ($50–$150)'));
    fireEvent.press(screen.getByText('Next'));

    await waitFor(() => {
      expect(
        screen.getByText(/Suggested for you|Trending|No suggestions yet|Search \/ add your own/)
      ).toBeTruthy();
    });

    fireEvent.press(screen.getByText('Finish'));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));

    const [finalResponses] = onSubmit.mock.calls[0];
    expect(finalResponses.styleIdentity).toEqual(['masculine']);
    expect(finalResponses.styleVibes).toEqual(['minimalist']);
    expect(finalResponses.selectedBrandIds).toEqual([]);
    expect(finalResponses.typedBrandNames).toEqual([]);
    expect(onSkip).not.toHaveBeenCalled();
  });
});
