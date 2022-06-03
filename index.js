/**
 * Copyright 2020 Amazon.com, Inc. and its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: LicenseRef-.amazon.com.-AmznSL-1.0
 *
 * Licensed under the Amazon Software License (the "License").
 * You may not use this file except in compliance with the License.
 * A copy of the License is located at
 *
 * http://aws.amazon.com/asl/
 *
 * or in the "LICENSE" file accompanying this file. This file is distributed
 * on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
 * express or implied. See the License for the specific language governing
 * permissions and limitations under the License.
 **/
const Alexa = require('ask-sdk-core');
const i18next = require('i18next');
const sprintf = require('sprintf-js').sprintf;
const RESOURCES = require('./resources');
const util = require('./util');
const weatherClient = require('./weather-client');

const GetWeatherApiHandler = {
    canHandle(handlerInput) {
        return util.isApiRequest(handlerInput, 'GetWeatherApi');
    },
    handle(handlerInput) {
        const cityNameWithId = util.getCityNameWithIdFromApiRequestSlots(handlerInput);

        if (!cityNameWithId) {
            // We couldn't match this city value to our slot, we'll return empty and let the response template handle it.
            return {apiResponse:{}};
        }

        // "Call a service" to get the weather for this location and date.
        const weather = weatherClient.getWeather(cityNameWithId.id);

        const response = {
            apiResponse : {
                cityName: cityNameWithId.name,
                lowTemperature: weather.lowTemperature,
                highTemperature: weather.highTemperature
            }
        }


        return response;
    }
}

const SessionEndedRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'SessionEndedRequest';
    },
    handle(handlerInput) {
        // Any cleanup logic goes here.
        return handlerInput.responseBuilder.getResponse();
    }
};

// The intent reflector is used for interaction model testing and debugging.
// It will simply repeat the intent the user said. You can create custom handlers
// for your intents by defining them above, then also adding them to the request
// handler chain below.
const IntentReflectorHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest';
    },
    handle(handlerInput) {
        const intentName = Alexa.getIntentName(handlerInput.requestEnvelope);
        const speakOutput = `You just triggered ${intentName}`;

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .getResponse();
    }
};

// Generic error handling to capture any syntax or routing errors. If you receive an error
// stating the request handler chain is not found, you have not implemented a handler for
// the intent being invoked or included it in the skill builder below.
const ErrorHandler = {
    canHandle() {
        return true;
    },
    handle(handlerInput, error) {
        console.error(`Error handled: ${error.message}`);
        console.error(`Error stack`, JSON.stringify(error.stack));
        console.error(`Error`, JSON.stringify(error));

        const speakOutput = handlerInput.t('ERROR_MESSAGE');

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

// *****************************************************************************
// These simple interceptors just log the incoming and outgoing request bodies to assist in debugging. The localization
// interceptor adds a t()-delegating method to localize strings.

const LogRequestInterceptor = {
    process(handlerInput) {
        console.log(`REQUEST ENVELOPE = ${JSON.stringify(handlerInput.requestEnvelope)}`);
    },
};

const LocalizationInterceptor = {
    process(handlerInput) {
        i18next.init({
            lng: handlerInput.requestEnvelope.request.locale,
            fallbackLng: 'en',
            overloadTranslationOptionHandler: sprintf.overloadTranslationOptionHandler,
            resources: RESOURCES,
            returnObjects: true
        });

        const baseOpts = {
            interpolation: {
                escapeValue: false
            }
        };

        handlerInput.t = (key, opts) => {
            const value = i18next.t(key, {
                ...baseOpts,
                ...opts
            });

            if (Array.isArray(value)) {
                return value[Math.floor(Math.random() * value.length)];
            } else {
                return value;
            }
        };
    }
};

const LogResponseInterceptor = {
    process(handlerInput, response) {
        console.log(`RESPONSE = ${JSON.stringify(response)}`);
    },
};

// The SkillBuilder acts as the entry point for your skill, routing all request and response
// payloads to the handlers above. Make sure any new handlers or interceptors you've
// defined are included below. The order matters - they're processed top to bottom.
exports.handler = Alexa.SkillBuilders.custom()
    .addRequestHandlers(
        GetWeatherApiHandler,
        SessionEndedRequestHandler,
        IntentReflectorHandler, // make sure IntentReflectorHandler is last so it doesn't override your custom intent handlers
    )
    .addErrorHandlers(ErrorHandler)
    .addRequestInterceptors(LogRequestInterceptor, LocalizationInterceptor)
    .addResponseInterceptors(LogResponseInterceptor)
    .lambda();
