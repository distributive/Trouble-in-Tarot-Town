const fs = require ("fs");

let settings = {};
let defaultSettings = {};

// Game variables
defaultSettings.MINIMUM_PLAYER_COUNT = 3;
defaultSettings.TURN_TIME_LIMIT = 60;
defaultSettings.PRE_GAME_TIME = 5;
defaultSettings.POST_GAME_TIME = 20;

// Faction variables
defaultSettings.TRAITOR_CONSTANT = -2/3;
defaultSettings.TRAITOR_FRACTION = 1/3;
defaultSettings.DETECTIVE_CONSTANT = 0;
defaultSettings.DETECTIVE_FRACTION = 0.1;

// Load in settings from file
loadDefaults ();
loadSettings ();

// Saving and loading
function saveSettings ()
{
    fs.writeFileSync ("./settings.json", JSON.stringify (settings));
}
function loadSettings ()
{
    if (fs.existsSync ("./settings.json"))
    {
        try
        {
            let newSettings = JSON.parse (fs.readFileSync ("./settings.json", "utf8"));

            if (Object.keys (settings).length == Object.keys (newSettings).length && Object.keys (settings).every (key => newSettings.hasOwnProperty (key)) && Object.keys (newSettings).every (key => !isNaN (newSettings[key])))
            {
                settings = newSettings;
                return true;
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
    return false;
}
function loadDefaults ()
{
    settings = {};
    Object.keys (defaultSettings).forEach((key, i) => {
        settings[key] = defaultSettings[key];
    });

}
function loadDefault (setting, value)
{
    if (settings.hasOwnProperty (setting) && !isNaN (value))
        settings[setting] = parseInt (value);
}

module.exports = {
    settings,
    saveSettings,
    loadSettings,
    loadDefaults
}
