const fs = require ("fs");

interface Settings
{
    // Game variables
    MINIMUM_PLAYER_COUNT: number;
    TURN_TIME_LIMIT: number;
    PRE_GAME_TIME: number;
    POST_GAME_TIME: number;

    // Faction variables
    TRAITOR_CONSTANT: number;
    TRAITOR_FRACTION: number;

    DETECTIVE_CONSTANT: number;
    DETECTIVE_FRACTION: number;

    ANARCHIST_THRESHOLD: number;
    ANARCHIST_PROBABILITY: number;
    JESTER_ENABLED: number;
    SK_ENABLED: number;
}

export let settings: Settings = {
    MINIMUM_PLAYER_COUNT: 0,
    TURN_TIME_LIMIT: 0,
    PRE_GAME_TIME: 0,
    POST_GAME_TIME: 0,

    TRAITOR_CONSTANT: 0,
    TRAITOR_FRACTION: 0,

    DETECTIVE_CONSTANT: 0,
    DETECTIVE_FRACTION: 0,

    ANARCHIST_THRESHOLD: 0,
    ANARCHIST_PROBABILITY: 0,
    JESTER_ENABLED: 0,
    SK_ENABLED: 0
};
let defaultSettings: Settings = {
    MINIMUM_PLAYER_COUNT: 3,
    TURN_TIME_LIMIT: 60,
    PRE_GAME_TIME: 5,
    POST_GAME_TIME: 20,

    TRAITOR_CONSTANT: -2/3,
    TRAITOR_FRACTION: 1/3,

    DETECTIVE_CONSTANT: 0,
    DETECTIVE_FRACTION: 0.1,

    ANARCHIST_THRESHOLD: 6,
    ANARCHIST_PROBABILITY: 0.5,
    JESTER_ENABLED: 1,
    SK_ENABLED: 1
};

// Load in settings from file
loadDefaults ();
loadSettings ();

// Saving and loading
export function saveSettings (): void
{
    fs.writeFileSync ("./settings.json", JSON.stringify (settings));
}
export function loadSettings (): void
{
    if (fs.existsSync ("./settings.json"))
    {
        try
        {
            let newSettings = JSON.parse (fs.readFileSync ("./settings.json", "utf8"));

            if (Object.keys (settings).length == Object.keys (newSettings).length && Object.keys (settings).every (key => newSettings.hasOwnProperty (key)) && Object.keys (newSettings).every (key => !isNaN (newSettings[key])))
            {
                settings = newSettings;
                return;
            }
            else
            {
                console.error ("Invalid data found in settings.json.");
            }
        }
        catch (e)
        {
            console.error ("Invalid JSON found in settings.json.");
        }
    }
    else
    {
        console.error ("Could not find settings.json.")
    }

    console.error ("Using defaults.");
    loadDefaults ();
}
export function loadDefaults (): void
{
    Object.keys (defaultSettings).forEach ((key, i) => {
        settings[key] = defaultSettings[key];
    });
}
export function loadDefault (setting: string): void
{
    if (settings.hasOwnProperty (setting) && defaultSettings.hasOwnProperty (setting))
        settings[setting] = defaultSettings[setting];
}
