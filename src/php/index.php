<?php
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (isset($_POST["ask"])) {
        switch ($_POST["ask"]) {
            case 'PasswordVerify':
                if (password_verify($_POST["password"], $_POST["hashed_password"]))
                    echo "true";
                else
                    echo "false";
                break;
            /*
            You might wonder why there is no salter here, I'm not planning on adding it.
            Right now we check against PHP-builtins, from our legacy codebase, and also against Bcrypt directly in Node.

            This answer is a perfect example.
            https://stackoverflow.com/a/17201754/19222487
            */
        }
        exit;
    }
    echo "No `ask` found.";
    exit;
}
?>

hello! You should only be able to see this on the server itself, it should be only served from localhost.