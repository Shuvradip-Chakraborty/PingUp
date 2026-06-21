import { Inngest } from "inngest";
import User from "../models/User.js";
import Connection from "../models/Connection.js";
import sendEmail from "../configs/nodeMailer.js";

// Create a client to send and receive events
export const inngest = new Inngest({ id: "pingup-app" });

// Inngest function to save user data to a database..
const syncUserCreation = inngest.createFunction(
    {
    id: 'sync-user-from-clerk',
    triggers: [{event: 'clerk/user.created'}],
    },
    async ({event}) => {
        const {id, first_name, last_name, email_addresses, image_url} = event.data
        let username = email_addresses[0].email_address.split('@')[0]

        //check availability of username
        const user = await User.findOne({username})

        if(user){
            username = username + Math.floor(Math.random() * 10000)
        }

        const userData = {
            _id: id,
            email: email_addresses[0].email_address,
            full_name: first_name + ' ' + last_name,
            profile_picture: image_url,
            username
        }

        await User.create(userData)

    }
)


// Inngest function to update user data to a database..
const syncUserUpdation = inngest.createFunction(
  {
    id: "update-user-from-clerk",
    triggers: [{ event: "clerk/user.updated" }],
  },
  async ({ event }) => {
    const { id, first_name, last_name, email_addresses, image_url } =
      event.data;

    const updatedUserData = {
      email: email_addresses[0].email_address,
      full_name: first_name + " " + last_name,
      profile_picture: image_url,
    };

    await User.findByIdAndUpdate(id, updatedUserData);
  },
);


// Inngest function to delete user data to a database..
const syncUserDeletion = inngest.createFunction(
  {
    id: "delete-user-from-clerk",
    triggers: [{ event: "clerk/user.deleted" }],
  },
  async ({ event }) => {
    const { id } = event.data;
    await User.findByIdAndDelete(id);
  },
);

//Inngest function to send Reminder when a new connection request is added..
const sendNewConnectionRequestReminder = inngest.createFunction(
  { id: "send-new-connection-request-reminder",
  triggers: [{event: "app/connection-request"}],
  },
  async ({event, step}) => {
    const {connectionId} = event.data;

    await step.run('send-connection-request-mail', async () => {
      const connection = await Connection.findById(connectionId).populate('from_user_id to_user_id');
      const subject =  `👋 New Connection Request`;
      const body = `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Hi ${connection.to_user_id.full_name},</h2>
          <p>You have a new connection request from ${connection.from_user_id.full_name} - @${connection.from_user_id.username}</p>
          <p>Click <a href="${process.env.FRONTEND_URL}/connections" style="color: #10b981;">here</a> to accept or reject the request</p>
          <br/>
          <p>Thanks,<br/>PingUp - Stay Connected</p>
      </div> `;

      await sendEmail({
        to: connection.to_user_id.email,
        subject,
        body
      })
    })

    
    //after 24 hours sending remainder mail again..
    const in24Hours = new Date(Date.now() + 24*60*60*1000)
    await step.sleepUntil("wait-for-24-hours", in24Hours);
    await step.run('send-connection-request-remainder', async () => {
      const connection = await Connection.findById(connectionId).populate('from_user_id to_user_id')

      if(connection.status === "accepted"){
        return {message: "Already accepted"}
      }
      const subject = `👋 New Connection Request`;
      const body = `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Hi ${connection.to_user_id.full_name},</h2>
          <p>You have a new connection request from ${connection.from_user_id.full_name} - @${connection.from_user_id.username}</p>
          <p>Click <a href="${process.env.FRONTEND_URL}/connections" style="color: #10b981;">here</a> to accept or reject the request</p>
          <br/>
          <p>Thanks,<br/>PingUp - Stay Connected</p>
      </div> `;

      await sendEmail({
        to: connection.to_user_id.email,
        subject,
        body,
      });

      return {message: "Reminder sent."}

    })

  }
)



// Create an empty array where we'll export future Inngest functions
export const functions = [
    syncUserCreation,
    syncUserUpdation,
    syncUserDeletion,
    sendNewConnectionRequestReminder,
];
