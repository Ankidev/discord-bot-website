# discord-bot-website
Website for tombot. Live at https://69420.me/

## Additional notes:
- The stats DB is reads from uses the eris-sharder stats format in my fork of eris-sharder https://github.com/fatchan/eris-sharder
- The stats DB must be a replset to enable changestreams.
- Configs has separate db for stats reading and session storage.
- Has a config, but probably some additional TomBot-specific stuff you need to change.
- The "dashboard" just reads from my DB at the moment (no editing functionality atm) and probably won't work for your situation so you might need to adjust he api/guilds route.
- Feel free to join https://69420.me/support If you want some help, or post an issue if you find an actual problem.
