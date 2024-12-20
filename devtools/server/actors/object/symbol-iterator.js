/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

const { Actor } = require("resource://devtools/shared/protocol.js");
const { symbolIteratorSpec } = require("resource://devtools/shared/specs/symbol-iterator.js");

const DevToolsUtils = require("resource://devtools/shared/DevToolsUtils.js");

loader.lazyRequireGetter(
  this,
  "propertyDescriptor",
  "resource://devtools/server/actors/object/property-descriptor.js",
  true
);

/**
 * Creates an actor to iterate over an object's symbols.
 *
 * @param objectActor ObjectActor
 *        The object actor.
 */
class SymbolIteratorActor extends Actor {
  constructor(objectActor, conn) {
    super(conn, symbolIteratorSpec);

    let symbols = [];
    if (DevToolsUtils.isSafeDebuggerObject(objectActor.obj)) {
      try {
        symbols = objectActor.obj.getOwnPropertySymbols();
      } catch (err) {
        // The above can throw when the debuggee does not subsume the object's
        // compartment, or for some WrappedNatives like Cu.Sandbox.
      }
    }

    this.iterator = {
      size: symbols.length,
      symbolDescription(index) {
        const symbol = symbols[index];
        return {
          name: symbol.toString(),
          descriptor: propertyDescriptor(objectActor, symbol, 0),
        };
      },
    };
  }

  form() {
    return {
      type: this.typeName,
      actor: this.actorID,
      count: this.iterator.size,
    };
  }

  slice({ start, count }) {
    const ownSymbols = [];
    for (let i = start, m = start + count; i < m; i++) {
      ownSymbols.push(this.iterator.symbolDescription(i));
    }
    return {
      ownSymbols,
    };
  }

  all() {
    return this.slice({ start: 0, count: this.iterator.size });
  }
}

exports.SymbolIteratorActor = SymbolIteratorActor;
