https://firebase.google.com/docs/cli/
https://github.com/firebase/functions-samples/tree/master/quickstarts/big-ben
https://github.com/firebase/functions-samples/tree/master/stripe

npm install -g firebase-tools

cd functions && npm install; cd ..

firebase login

firebase deploy

firebase deploy --only functions:trigger1
