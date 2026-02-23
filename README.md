# ISS Tracker

Simple React app that displays the live International Space Station location on a Leaflet world map and updates it in real time.

## Run

- Install dependencies: `npm install`
- Start dev server: `npm start`
- Build production bundle: `npm run build`
- Run tests: `npm test -- --watchAll=false --passWithNoTests`

## Data Source

- ISS API: `https://api.wheretheiss.at/v1/satellites/25544`

## Project Structure

- `src/common/api/`
- `src/common/context/`
- `src/common/hooks/`
- `src/components/`
- `src/layouts/`
- `src/App.js`
- `src/index.js`

## Architecture Notes

- API calls are isolated in `src/common/api` (`fetchIssLocation`).
- ISS state and polling logic live in provider code in `src/layouts/appWrapper.js` via `IssProvider`.
- `setInterval` polling refreshes every 5 seconds and is cleaned up on unmount.
- UI components (`MapView`, `IssMarker`, `StatusBar`) are presentational and consume context data via hook.
- `App.js` composes providers with `compose(ThemeProvider, IssProvider, AppWrapper)`.

## Features

- Live ISS position marker on world map.
- Smooth map recentering as ISS moves.
- Status bar with latitude, longitude, and last updated timestamp.
- Loading/error handling for API fetches.
