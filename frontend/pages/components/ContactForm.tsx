import React, { useState } from "react";
import { useForm, ValidationError } from '@formspree/react';
import config from "../index.json";

function ContactForm() {
  const contact = config.contact;
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const [state, handleSubmit] = useForm(contact.formId);

  return (
    <div className="w-full max-w-2xl mx-auto p-6">
      {state.succeeded ? (
        <div className="text-center p-8 bg-gradient-to-r from-rose-400/10 via-fuchsia-500/10 to-indigo-500/10 rounded-2xl border border-gray-200 dark:border-gray-700">
          <div className="mb-4">
            <svg className="w-16 h-16 mx-auto text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold bg-gradient-to-r from-rose-400 via-fuchsia-500 to-indigo-500 bg-clip-text text-transparent mb-2">
            Message Sent Successfully!
          </h3>
          <p className="text-gray-600 dark:text-gray-300">
            I'll get back to you as soon as possible. Thank you for reaching out!
          </p>
        </div>
      ) : (
        <div className="w-full sm:w-full md:w-3/4 lg:w-1/2 mt-16 mx-auto">
          <form 
            onSubmit={handleSubmit} 
            action={`https://formspree.io/f/${contact.formId}`}
            method="post" 
            className="bg-white dark:bg-gray-800 shadow-md rounded px-8 pt-6 pb-8 mb-4 dark:shadow-gray-900"
          >
            <div className="mb-4">
              <label className="block text-gray-700 dark:text-gray-300 font-bold mb-2" htmlFor="name">
                Name
              </label>
              <input
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-gray-300 dark:bg-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                id="name"
                type="text"
                name="name"
                placeholder="Enter your name"
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 dark:text-gray-300 font-bold mb-2" htmlFor="email">
                Email
              </label>
              <input
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-gray-300 dark:bg-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                id="email"
                type="email"
                name="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 dark:text-gray-300 font-bold mb-2" htmlFor="message">
                Message
              </label>
              <textarea
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-gray-300 dark:bg-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                id="message"
                name="message"
                rows={5}
                placeholder="Enter your message"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
              />
              <ValidationError 
                prefix="Message" 
                field="message"
                errors={state.errors}
              />
            </div>
            <div className="flex items-center justify-center">
              <button 
                type="submit"
                disabled={state.submitting}
                className="text-lg font-bold p-0.5 mt-6 w-44 bg-gradient-to-r from-rose-400 via-fuchsia-500 to-indigo-500 rounded-lg"
              >
                <div className="bg-white dark:bg-gray-800 rounded-lg">
                  <span className="block p-2 font-semibold bg-gradient-to-r from-rose-400 via-fuchsia-500 to-indigo-500 bg-clip-text text-transparent">
                    {state.submitting ? "Sending..." : "Send"}
                  </span>
                </div>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default ContactForm;
