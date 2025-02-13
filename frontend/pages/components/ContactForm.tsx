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
        <div className="text-center p-8 bg-gradient-to-r from-rose-400/10 via-fuchsia-500/10 to-indigo-500/10 rounded-2xl border border-gray-200 dark:border-gray-700 animate-scale-in">
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
        <div className="relative">
          <h2 className="text-2xl font-bold text-center mb-8 text-gray-800 dark:text-gray-200">
            Send me a message
          </h2>

          <form 
            onSubmit={handleSubmit} 
            action={`https://formspree.io/f/${contact.formId}`}
            method="post" 
            className="relative bg-white/50 dark:bg-gray-800/50 backdrop-blur-md shadow-xl rounded-2xl px-8 pt-8 pb-8"
          >
            <div className="mb-6 group">
              <label className="block text-gray-700 dark:text-gray-300 font-medium text-sm mb-2 transition-colors duration-200" htmlFor="name">
                Name
              </label>
              <input
                className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-white/50 dark:bg-gray-700/50 
                         focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300
                         text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500"
                id="name"
                type="text"
                name="name"
                placeholder="Your name"
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </div>

            <div className="mb-6 group">
              <label className="block text-gray-700 dark:text-gray-300 font-medium text-sm mb-2 transition-colors duration-200" htmlFor="email">
                Email
              </label>
              <input
                className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-white/50 dark:bg-gray-700/50 
                         focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300
                         text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500"
                id="email"
                type="email"
                name="email"
                placeholder="your.email@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>

            <div className="mb-6 group">
              <label className="block text-gray-700 dark:text-gray-300 font-medium text-sm mb-2 transition-colors duration-200" htmlFor="message">
                Message
              </label>
              <textarea
                className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-white/50 dark:bg-gray-700/50 
                         focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300
                         text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 min-h-[150px] resize-y"
                id="message"
                name="message"
                placeholder="Your message here..."
                value={message}
                onChange={(event) => setMessage(event.target.value)}
              />
              <ValidationError prefix="Message" field="message" errors={state.errors} />
            </div>

            <div className="flex items-center justify-center">
              <button 
                type="submit"
                disabled={state.submitting}
                className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-rose-400 via-fuchsia-500 to-indigo-500 
                         text-white font-medium rounded-lg shadow-lg hover:shadow-xl 
                         transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]
                         disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="relative inline-flex items-center">
                  {state.submitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Sending...
                    </>
                  ) : (
                    "Send Message"
                  )}
                </span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default ContactForm;
