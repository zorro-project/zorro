### Setup

- Install the version of NodeJS specified in `./.node-version` (currently 16.13.0)
- We use Yarn as our package manager. To get the dependencies installed, just do this in the root directory: `npm install yarn && yarn install`
- Run postgres locally. One option is to install [postgres.app](postgres.app)
- Set up environment: Copy a `.env.example` over to `.env` and fill it out
- Initialize database: `yarn rw prisma migrate reset`
- Make sure everything is working: `yarn run-checks`

### Fire it up

```terminal
yarn dev
```

You should be able to open a browser to `http://localhost:8910` to see the web app. Lambda functions run on `http://localhost:8911` and are also proxied to `http://localhost:8910/.redwood/functions/*`.
