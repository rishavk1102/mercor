import React, { useEffect, useState, useRef } from "react";
import firebase from "firebase/compat/app";
import "firebase/compat/messaging";
import "firebase/compat/auth";
import axios from "axios";
import {
  Routes,
  Route,
  BrowserRouter,
  useNavigate,
  useLocation,
} from "react-router-dom";
import {
  Paper,
  Grid,
  Divider,
  TextField,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Avatar,
  Fab,
} from "@mui/material";
import { makeStyles } from "@mui/styles";
import { Send } from "@mui/icons-material";

import "./App.css";

const useStyles = makeStyles({
  table: {
    minWidth: 650,
  },
  chatSection: {
    width: "100%",
    height: "80vh",
  },
  headBG: {
    backgroundColor: "#e0e0e0",
  },
  borderRight500: {
    borderRight: "1px solid #e0e0e0",
  },
  messageArea: {
    height: "70vh",
    overflowY: "auto",
  },
});

const firebaseConfig = {
  apiKey: "AIzaSyBIVW2xchzn3TSAbUgz-abM9dl2hFiSprI",
  authDomain: "mercor-hiring.firebaseapp.com",
  projectId: "mercor-hiring",
  storageBucket: "mercor-hiring.appspot.com",
  messagingSenderId: "1022267415978",
  appId: "1:1022267415978:web:49bd142f163836fdc29fd3",
  measurementId: "G-XW8FT3KJX0",
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

const requestNotificationPermission = async () => {
  try {
    await Notification.requestPermission();
    console.log("Notification permission granted.");

    navigator.serviceWorker
      .register("./firebase-messaging-sw.js")
      .then((registration) => {
        messaging
          .getToken({
            serviceWorkerRegistration: registration,
            vapidKey:
              "BL2F2EzcL9DbTPOVlOTXyJuKkkytVu2pG-8enuVL5UIQl_tc751njEfrcWtSVFQ6qmpKTjWABYs5YG2wHyD_6Mk",
          })
          .then((token) => {
            localStorage.setItem("deviceToken", token);
          });
      });
  } catch (error) {
    console.log("Unable to get permission to notify.", error);
  }
};

function App() {
  useEffect(() => {
    requestNotificationPermission();

    // Listen for changes to notification permissions
    const handlePermissionChange = () => {
      console.log("Permission status:", Notification.permission);
    };

    document.addEventListener("permissionchange", handlePermissionChange);

    return () => {
      document.removeEventListener("permissionchange", handlePermissionChange);
    };
  }, []);

  return (
    <div>
      <BrowserRouter>
        <Routes>
          <Route exact path="/" element={<Landing />} />
          <Route path="/chat" element={<Chat />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

const Landing = () => {
  const navigate = useNavigate();
  const signInWithGoogle = () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    firebase
      .auth()
      .signInWithPopup(provider)
      .then((userCred) => {
        let user = userCred.user;
        console.log(user.displayName);
        console.log(user.email);
        console.log(user.photoURL);

        axios
          .post(
            "https://us-central1-mercor-hiring.cloudfunctions.net/app/user/new",
            {
              name: user.displayName,
              email: user.email,
              image: user.photoURL,
              token: localStorage.getItem("deviceToken"),
            }
          )
          .then((response) => {
            if (response.status === 200) {
              // Open chat's page
              console.log("Success it is");
              navigate("/chat", {
                state: {
                  user: {
                    name: user.displayName,
                    email: user.email,
                    image: user.photoURL,
                    token: localStorage.getItem("deviceToken"),
                  },
                },
              });
            } else {
              window.alert("Some error occured! Please try again.");
            }
          })
          .catch((error) => {
            window.alert("Some error occured! Please try again.");
          });
      })
      .catch((reason) => {
        window.alert("Some error occured! Please try again.");
      });
  };

  return (
    <div className="App">
      <p>Mercor Backend Challenge</p>
      <button onClick={signInWithGoogle}>Sign in with Google</button>
    </div>
  );
};

const Chat = () => {
  const classes = useStyles();
  const location = useLocation();
  const listRef = useRef(null);

  const user = location.state.user;

  const [otherUsers, setOtherUsers] = useState([]);
  const [selectedUserIndex, setSelectedUserIndex] = useState(0);
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState();

  messaging.onMessage((payload) => {
    console.log("Received FCM message:", payload);
    userClicked();
  });

  useEffect(() => {
    axios
      .get("https://us-central1-mercor-hiring.cloudfunctions.net/app/user/all")
      .then((response) => {
        let users = response.data.filter((u) => u.email !== user.email);
        setOtherUsers(users);
      })
      .catch((err) => {
        window.alert("Error occured! Please try again.");
      });

    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [user.email]);

  const dateConvert = (d) => {
    const date = new Date(d);
    return date.toISOString().slice(11, 16);
  };

  const userClicked = () => {
    axios
      .get(
        `https://us-central1-mercor-hiring.cloudfunctions.net/app/chat/get?from=${user.email}&to=${otherUsers[selectedUserIndex].email}`
      )
      .then((response) => {
        let msg = response.data;
        const sortedData = msg.sort((a, b) => {
          const timeA = new Date(a.created_at).getTime();
          const timeB = new Date(b.created_at).getTime();
          return timeA - timeB;
        });
        setMessages(sortedData);
        console.log(messages);
      })
      .catch((err) => {
        window.alert("Error occured! Please try again.");
      });
  };

  const sendMessage = () => {
    axios
      .post(
        "https://us-central1-mercor-hiring.cloudfunctions.net/app/message/send",
        {
          to: otherUsers[selectedUserIndex].email,
          from: user.email,
          message: newMsg,
        }
      )
      .then((response) => {
        setNewMsg("");
        userClicked(selectedUserIndex);
      });
  };

  return (
    <div>
      <Grid container>
        <Grid item xs={12}>
          <Typography variant="h5" className="header-message">
            Chat
          </Typography>
        </Grid>
      </Grid>
      <Grid container component={Paper} className={classes.chatSection}>
        <Grid item xs={3} className={classes.borderRight500}>
          <List>
            <ListItem button key="RemySharp">
              <ListItemIcon>
                <Avatar alt="Remy Sharp" src={user.image} />
              </ListItemIcon>
              <ListItemText primary={user.name}></ListItemText>
            </ListItem>
          </List>
          <Divider />
          <List>
            {otherUsers.map((u) => (
              <ListItem
                button
                key={u.name}
                onClick={() => {
                  setSelectedUserIndex(otherUsers.indexOf(u));
                  console.log(selectedUserIndex)
                  userClicked();
                }}
              >
                <ListItemIcon>
                  <Avatar alt={u.name} src={u.image} />
                </ListItemIcon>
                <ListItemText primary={u.name}>{u.name}</ListItemText>
              </ListItem>
            ))}
          </List>
        </Grid>
        <Grid item xs={9}>
          <List ref={listRef} className={classes.messageArea}>
            {messages.map((m) => (
              <ListItem key={messages.indexOf(m).toString()}>
                <Grid container>
                  <Grid item xs={12}>
                    <ListItemText
                      align={m.from_user === user.email ? "right" : "left"}
                      primary={m.body}
                    ></ListItemText>
                  </Grid>
                  <Grid item xs={12}>
                    <ListItemText
                      align={m.from_user === user.email ? "right" : "left"}
                      secondary={dateConvert(m.created_at)}
                    ></ListItemText>
                  </Grid>
                </Grid>
              </ListItem>
            ))}
          </List>
          <Divider />
          <Grid container style={{ padding: "20px" }}>
            <Grid item xs={11}>
              <TextField
                id="outlined-basic-email"
                label="Type Something"
                fullWidth
                value={newMsg}
                onChange={(event) => {
                  setNewMsg(event.target.value);
                }}
              />
            </Grid>
            <Grid item xs={1} align="right">
              <Fab color="primary" aria-label="add" onClick={sendMessage}>
                <Send />
              </Fab>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </div>
  );
};

export default App;
