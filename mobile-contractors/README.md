# Contractor Mobile App

This is a React Native mobile starter built with Expo for contractor users only.

## What is included

- Contractor login screen
- Forgot password placeholder screen
- Protected contractor dashboard
- Contractor jobs screen
- Contractor profile and logout
- Token storage with AsyncStorage
- Spring Boot API service layer

## Backend expectation

The login service currently expects a Spring Boot endpoint like this:

- `POST /api/contractors/auth/login`

Expected response shape:

```json
{
  "token": "jwt-token-here",
  "contractor": {
    "id": "1",
    "fullName": "John Contractor",
    "email": "john@example.com",
    "phone": "+91 9999999999",
    "companyName": "ABC Services"
  }
}
```

## Setup

1. Open the app folder:

```bash
cd mobile-contractors
```

2. Install packages:

```bash
npm install
```

3. Update API URL in `src/config/env.ts`:

```ts
export const API_BASE_URL = "http://YOUR_LOCAL_IP:8080/api";
```

Use your machine IP, not `localhost`, when testing on a real phone.

4. Start Expo:

```bash
npm run start
```

## Next changes you will probably want

- Replace dummy jobs with backend API data
- Add contractor registration only if your business allows it
- Add JWT authorization header interceptor
- Add task details, attendance, uploads, notifications, and approvals for contractors
