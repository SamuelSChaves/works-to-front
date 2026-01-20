var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __commonJS = (cb, mod) => function __require2() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// wrangler-modules-watch:wrangler:modules-watch
var init_wrangler_modules_watch = __esm({
  "wrangler-modules-watch:wrangler:modules-watch"() {
    init_modules_watch_stub();
  }
});

// node_modules/wrangler/templates/modules-watch-stub.js
var init_modules_watch_stub = __esm({
  "node_modules/wrangler/templates/modules-watch-stub.js"() {
    init_wrangler_modules_watch();
  }
});

// node_modules/bcryptjs/dist/bcrypt.js
var require_bcrypt = __commonJS({
  "node_modules/bcryptjs/dist/bcrypt.js"(exports, module) {
    init_modules_watch_stub();
    (function(global, factory) {
      if (typeof define === "function" && define["amd"])
        define([], factory);
      else if (typeof __require === "function" && typeof module === "object" && module && module["exports"])
        module["exports"] = factory();
      else
        (global["dcodeIO"] = global["dcodeIO"] || {})["bcrypt"] = factory();
    })(exports, function() {
      "use strict";
      var bcrypt2 = {};
      var randomFallback = null;
      function random(len) {
        if (typeof module !== "undefined" && module && module["exports"])
          try {
            return __require("crypto")["randomBytes"](len);
          } catch (e) {
          }
        try {
          var a;
          (self["crypto"] || self["msCrypto"])["getRandomValues"](a = new Uint32Array(len));
          return Array.prototype.slice.call(a);
        } catch (e) {
        }
        if (!randomFallback)
          throw Error("Neither WebCryptoAPI nor a crypto module is available. Use bcrypt.setRandomFallback to set an alternative");
        return randomFallback(len);
      }
      __name(random, "random");
      var randomAvailable = false;
      try {
        random(1);
        randomAvailable = true;
      } catch (e) {
      }
      randomFallback = null;
      bcrypt2.setRandomFallback = function(random2) {
        randomFallback = random2;
      };
      bcrypt2.genSaltSync = function(rounds, seed_length) {
        rounds = rounds || GENSALT_DEFAULT_LOG2_ROUNDS;
        if (typeof rounds !== "number")
          throw Error("Illegal arguments: " + typeof rounds + ", " + typeof seed_length);
        if (rounds < 4)
          rounds = 4;
        else if (rounds > 31)
          rounds = 31;
        var salt = [];
        salt.push("$2a$");
        if (rounds < 10)
          salt.push("0");
        salt.push(rounds.toString());
        salt.push("$");
        salt.push(base64_encode(random(BCRYPT_SALT_LEN), BCRYPT_SALT_LEN));
        return salt.join("");
      };
      bcrypt2.genSalt = function(rounds, seed_length, callback) {
        if (typeof seed_length === "function")
          callback = seed_length, seed_length = void 0;
        if (typeof rounds === "function")
          callback = rounds, rounds = void 0;
        if (typeof rounds === "undefined")
          rounds = GENSALT_DEFAULT_LOG2_ROUNDS;
        else if (typeof rounds !== "number")
          throw Error("illegal arguments: " + typeof rounds);
        function _async(callback2) {
          nextTick(function() {
            try {
              callback2(null, bcrypt2.genSaltSync(rounds));
            } catch (err) {
              callback2(err);
            }
          });
        }
        __name(_async, "_async");
        if (callback) {
          if (typeof callback !== "function")
            throw Error("Illegal callback: " + typeof callback);
          _async(callback);
        } else
          return new Promise(function(resolve, reject) {
            _async(function(err, res) {
              if (err) {
                reject(err);
                return;
              }
              resolve(res);
            });
          });
      };
      bcrypt2.hashSync = function(s, salt) {
        if (typeof salt === "undefined")
          salt = GENSALT_DEFAULT_LOG2_ROUNDS;
        if (typeof salt === "number")
          salt = bcrypt2.genSaltSync(salt);
        if (typeof s !== "string" || typeof salt !== "string")
          throw Error("Illegal arguments: " + typeof s + ", " + typeof salt);
        return _hash(s, salt);
      };
      bcrypt2.hash = function(s, salt, callback, progressCallback) {
        function _async(callback2) {
          if (typeof s === "string" && typeof salt === "number")
            bcrypt2.genSalt(salt, function(err, salt2) {
              _hash(s, salt2, callback2, progressCallback);
            });
          else if (typeof s === "string" && typeof salt === "string")
            _hash(s, salt, callback2, progressCallback);
          else
            nextTick(callback2.bind(this, Error("Illegal arguments: " + typeof s + ", " + typeof salt)));
        }
        __name(_async, "_async");
        if (callback) {
          if (typeof callback !== "function")
            throw Error("Illegal callback: " + typeof callback);
          _async(callback);
        } else
          return new Promise(function(resolve, reject) {
            _async(function(err, res) {
              if (err) {
                reject(err);
                return;
              }
              resolve(res);
            });
          });
      };
      function safeStringCompare(known, unknown) {
        var right = 0, wrong = 0;
        for (var i = 0, k = known.length; i < k; ++i) {
          if (known.charCodeAt(i) === unknown.charCodeAt(i))
            ++right;
          else
            ++wrong;
        }
        if (right < 0)
          return false;
        return wrong === 0;
      }
      __name(safeStringCompare, "safeStringCompare");
      bcrypt2.compareSync = function(s, hash) {
        if (typeof s !== "string" || typeof hash !== "string")
          throw Error("Illegal arguments: " + typeof s + ", " + typeof hash);
        if (hash.length !== 60)
          return false;
        return safeStringCompare(bcrypt2.hashSync(s, hash.substr(0, hash.length - 31)), hash);
      };
      bcrypt2.compare = function(s, hash, callback, progressCallback) {
        function _async(callback2) {
          if (typeof s !== "string" || typeof hash !== "string") {
            nextTick(callback2.bind(this, Error("Illegal arguments: " + typeof s + ", " + typeof hash)));
            return;
          }
          if (hash.length !== 60) {
            nextTick(callback2.bind(this, null, false));
            return;
          }
          bcrypt2.hash(s, hash.substr(0, 29), function(err, comp) {
            if (err)
              callback2(err);
            else
              callback2(null, safeStringCompare(comp, hash));
          }, progressCallback);
        }
        __name(_async, "_async");
        if (callback) {
          if (typeof callback !== "function")
            throw Error("Illegal callback: " + typeof callback);
          _async(callback);
        } else
          return new Promise(function(resolve, reject) {
            _async(function(err, res) {
              if (err) {
                reject(err);
                return;
              }
              resolve(res);
            });
          });
      };
      bcrypt2.getRounds = function(hash) {
        if (typeof hash !== "string")
          throw Error("Illegal arguments: " + typeof hash);
        return parseInt(hash.split("$")[2], 10);
      };
      bcrypt2.getSalt = function(hash) {
        if (typeof hash !== "string")
          throw Error("Illegal arguments: " + typeof hash);
        if (hash.length !== 60)
          throw Error("Illegal hash length: " + hash.length + " != 60");
        return hash.substring(0, 29);
      };
      var nextTick = typeof process !== "undefined" && process && typeof process.nextTick === "function" ? typeof setImmediate === "function" ? setImmediate : process.nextTick : setTimeout;
      function stringToBytes(str) {
        var out = [], i = 0;
        utfx.encodeUTF16toUTF8(function() {
          if (i >= str.length) return null;
          return str.charCodeAt(i++);
        }, function(b) {
          out.push(b);
        });
        return out;
      }
      __name(stringToBytes, "stringToBytes");
      var BASE64_CODE = "./ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789".split("");
      var BASE64_INDEX = [
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        0,
        1,
        54,
        55,
        56,
        57,
        58,
        59,
        60,
        61,
        62,
        63,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        2,
        3,
        4,
        5,
        6,
        7,
        8,
        9,
        10,
        11,
        12,
        13,
        14,
        15,
        16,
        17,
        18,
        19,
        20,
        21,
        22,
        23,
        24,
        25,
        26,
        27,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        28,
        29,
        30,
        31,
        32,
        33,
        34,
        35,
        36,
        37,
        38,
        39,
        40,
        41,
        42,
        43,
        44,
        45,
        46,
        47,
        48,
        49,
        50,
        51,
        52,
        53,
        -1,
        -1,
        -1,
        -1,
        -1
      ];
      var stringFromCharCode = String.fromCharCode;
      function base64_encode(b, len) {
        var off = 0, rs = [], c1, c2;
        if (len <= 0 || len > b.length)
          throw Error("Illegal len: " + len);
        while (off < len) {
          c1 = b[off++] & 255;
          rs.push(BASE64_CODE[c1 >> 2 & 63]);
          c1 = (c1 & 3) << 4;
          if (off >= len) {
            rs.push(BASE64_CODE[c1 & 63]);
            break;
          }
          c2 = b[off++] & 255;
          c1 |= c2 >> 4 & 15;
          rs.push(BASE64_CODE[c1 & 63]);
          c1 = (c2 & 15) << 2;
          if (off >= len) {
            rs.push(BASE64_CODE[c1 & 63]);
            break;
          }
          c2 = b[off++] & 255;
          c1 |= c2 >> 6 & 3;
          rs.push(BASE64_CODE[c1 & 63]);
          rs.push(BASE64_CODE[c2 & 63]);
        }
        return rs.join("");
      }
      __name(base64_encode, "base64_encode");
      function base64_decode(s, len) {
        var off = 0, slen = s.length, olen = 0, rs = [], c1, c2, c3, c4, o, code;
        if (len <= 0)
          throw Error("Illegal len: " + len);
        while (off < slen - 1 && olen < len) {
          code = s.charCodeAt(off++);
          c1 = code < BASE64_INDEX.length ? BASE64_INDEX[code] : -1;
          code = s.charCodeAt(off++);
          c2 = code < BASE64_INDEX.length ? BASE64_INDEX[code] : -1;
          if (c1 == -1 || c2 == -1)
            break;
          o = c1 << 2 >>> 0;
          o |= (c2 & 48) >> 4;
          rs.push(stringFromCharCode(o));
          if (++olen >= len || off >= slen)
            break;
          code = s.charCodeAt(off++);
          c3 = code < BASE64_INDEX.length ? BASE64_INDEX[code] : -1;
          if (c3 == -1)
            break;
          o = (c2 & 15) << 4 >>> 0;
          o |= (c3 & 60) >> 2;
          rs.push(stringFromCharCode(o));
          if (++olen >= len || off >= slen)
            break;
          code = s.charCodeAt(off++);
          c4 = code < BASE64_INDEX.length ? BASE64_INDEX[code] : -1;
          o = (c3 & 3) << 6 >>> 0;
          o |= c4;
          rs.push(stringFromCharCode(o));
          ++olen;
        }
        var res = [];
        for (off = 0; off < olen; off++)
          res.push(rs[off].charCodeAt(0));
        return res;
      }
      __name(base64_decode, "base64_decode");
      var utfx = (function() {
        "use strict";
        var utfx2 = {};
        utfx2.MAX_CODEPOINT = 1114111;
        utfx2.encodeUTF8 = function(src, dst) {
          var cp = null;
          if (typeof src === "number")
            cp = src, src = /* @__PURE__ */ __name(function() {
              return null;
            }, "src");
          while (cp !== null || (cp = src()) !== null) {
            if (cp < 128)
              dst(cp & 127);
            else if (cp < 2048)
              dst(cp >> 6 & 31 | 192), dst(cp & 63 | 128);
            else if (cp < 65536)
              dst(cp >> 12 & 15 | 224), dst(cp >> 6 & 63 | 128), dst(cp & 63 | 128);
            else
              dst(cp >> 18 & 7 | 240), dst(cp >> 12 & 63 | 128), dst(cp >> 6 & 63 | 128), dst(cp & 63 | 128);
            cp = null;
          }
        };
        utfx2.decodeUTF8 = function(src, dst) {
          var a, b, c, d, fail = /* @__PURE__ */ __name(function(b2) {
            b2 = b2.slice(0, b2.indexOf(null));
            var err = Error(b2.toString());
            err.name = "TruncatedError";
            err["bytes"] = b2;
            throw err;
          }, "fail");
          while ((a = src()) !== null) {
            if ((a & 128) === 0)
              dst(a);
            else if ((a & 224) === 192)
              (b = src()) === null && fail([a, b]), dst((a & 31) << 6 | b & 63);
            else if ((a & 240) === 224)
              ((b = src()) === null || (c = src()) === null) && fail([a, b, c]), dst((a & 15) << 12 | (b & 63) << 6 | c & 63);
            else if ((a & 248) === 240)
              ((b = src()) === null || (c = src()) === null || (d = src()) === null) && fail([a, b, c, d]), dst((a & 7) << 18 | (b & 63) << 12 | (c & 63) << 6 | d & 63);
            else throw RangeError("Illegal starting byte: " + a);
          }
        };
        utfx2.UTF16toUTF8 = function(src, dst) {
          var c1, c2 = null;
          while (true) {
            if ((c1 = c2 !== null ? c2 : src()) === null)
              break;
            if (c1 >= 55296 && c1 <= 57343) {
              if ((c2 = src()) !== null) {
                if (c2 >= 56320 && c2 <= 57343) {
                  dst((c1 - 55296) * 1024 + c2 - 56320 + 65536);
                  c2 = null;
                  continue;
                }
              }
            }
            dst(c1);
          }
          if (c2 !== null) dst(c2);
        };
        utfx2.UTF8toUTF16 = function(src, dst) {
          var cp = null;
          if (typeof src === "number")
            cp = src, src = /* @__PURE__ */ __name(function() {
              return null;
            }, "src");
          while (cp !== null || (cp = src()) !== null) {
            if (cp <= 65535)
              dst(cp);
            else
              cp -= 65536, dst((cp >> 10) + 55296), dst(cp % 1024 + 56320);
            cp = null;
          }
        };
        utfx2.encodeUTF16toUTF8 = function(src, dst) {
          utfx2.UTF16toUTF8(src, function(cp) {
            utfx2.encodeUTF8(cp, dst);
          });
        };
        utfx2.decodeUTF8toUTF16 = function(src, dst) {
          utfx2.decodeUTF8(src, function(cp) {
            utfx2.UTF8toUTF16(cp, dst);
          });
        };
        utfx2.calculateCodePoint = function(cp) {
          return cp < 128 ? 1 : cp < 2048 ? 2 : cp < 65536 ? 3 : 4;
        };
        utfx2.calculateUTF8 = function(src) {
          var cp, l = 0;
          while ((cp = src()) !== null)
            l += utfx2.calculateCodePoint(cp);
          return l;
        };
        utfx2.calculateUTF16asUTF8 = function(src) {
          var n = 0, l = 0;
          utfx2.UTF16toUTF8(src, function(cp) {
            ++n;
            l += utfx2.calculateCodePoint(cp);
          });
          return [n, l];
        };
        return utfx2;
      })();
      Date.now = Date.now || function() {
        return +/* @__PURE__ */ new Date();
      };
      var BCRYPT_SALT_LEN = 16;
      var GENSALT_DEFAULT_LOG2_ROUNDS = 10;
      var BLOWFISH_NUM_ROUNDS = 16;
      var MAX_EXECUTION_TIME = 100;
      var P_ORIG = [
        608135816,
        2242054355,
        320440878,
        57701188,
        2752067618,
        698298832,
        137296536,
        3964562569,
        1160258022,
        953160567,
        3193202383,
        887688300,
        3232508343,
        3380367581,
        1065670069,
        3041331479,
        2450970073,
        2306472731
      ];
      var S_ORIG = [
        3509652390,
        2564797868,
        805139163,
        3491422135,
        3101798381,
        1780907670,
        3128725573,
        4046225305,
        614570311,
        3012652279,
        134345442,
        2240740374,
        1667834072,
        1901547113,
        2757295779,
        4103290238,
        227898511,
        1921955416,
        1904987480,
        2182433518,
        2069144605,
        3260701109,
        2620446009,
        720527379,
        3318853667,
        677414384,
        3393288472,
        3101374703,
        2390351024,
        1614419982,
        1822297739,
        2954791486,
        3608508353,
        3174124327,
        2024746970,
        1432378464,
        3864339955,
        2857741204,
        1464375394,
        1676153920,
        1439316330,
        715854006,
        3033291828,
        289532110,
        2706671279,
        2087905683,
        3018724369,
        1668267050,
        732546397,
        1947742710,
        3462151702,
        2609353502,
        2950085171,
        1814351708,
        2050118529,
        680887927,
        999245976,
        1800124847,
        3300911131,
        1713906067,
        1641548236,
        4213287313,
        1216130144,
        1575780402,
        4018429277,
        3917837745,
        3693486850,
        3949271944,
        596196993,
        3549867205,
        258830323,
        2213823033,
        772490370,
        2760122372,
        1774776394,
        2652871518,
        566650946,
        4142492826,
        1728879713,
        2882767088,
        1783734482,
        3629395816,
        2517608232,
        2874225571,
        1861159788,
        326777828,
        3124490320,
        2130389656,
        2716951837,
        967770486,
        1724537150,
        2185432712,
        2364442137,
        1164943284,
        2105845187,
        998989502,
        3765401048,
        2244026483,
        1075463327,
        1455516326,
        1322494562,
        910128902,
        469688178,
        1117454909,
        936433444,
        3490320968,
        3675253459,
        1240580251,
        122909385,
        2157517691,
        634681816,
        4142456567,
        3825094682,
        3061402683,
        2540495037,
        79693498,
        3249098678,
        1084186820,
        1583128258,
        426386531,
        1761308591,
        1047286709,
        322548459,
        995290223,
        1845252383,
        2603652396,
        3431023940,
        2942221577,
        3202600964,
        3727903485,
        1712269319,
        422464435,
        3234572375,
        1170764815,
        3523960633,
        3117677531,
        1434042557,
        442511882,
        3600875718,
        1076654713,
        1738483198,
        4213154764,
        2393238008,
        3677496056,
        1014306527,
        4251020053,
        793779912,
        2902807211,
        842905082,
        4246964064,
        1395751752,
        1040244610,
        2656851899,
        3396308128,
        445077038,
        3742853595,
        3577915638,
        679411651,
        2892444358,
        2354009459,
        1767581616,
        3150600392,
        3791627101,
        3102740896,
        284835224,
        4246832056,
        1258075500,
        768725851,
        2589189241,
        3069724005,
        3532540348,
        1274779536,
        3789419226,
        2764799539,
        1660621633,
        3471099624,
        4011903706,
        913787905,
        3497959166,
        737222580,
        2514213453,
        2928710040,
        3937242737,
        1804850592,
        3499020752,
        2949064160,
        2386320175,
        2390070455,
        2415321851,
        4061277028,
        2290661394,
        2416832540,
        1336762016,
        1754252060,
        3520065937,
        3014181293,
        791618072,
        3188594551,
        3933548030,
        2332172193,
        3852520463,
        3043980520,
        413987798,
        3465142937,
        3030929376,
        4245938359,
        2093235073,
        3534596313,
        375366246,
        2157278981,
        2479649556,
        555357303,
        3870105701,
        2008414854,
        3344188149,
        4221384143,
        3956125452,
        2067696032,
        3594591187,
        2921233993,
        2428461,
        544322398,
        577241275,
        1471733935,
        610547355,
        4027169054,
        1432588573,
        1507829418,
        2025931657,
        3646575487,
        545086370,
        48609733,
        2200306550,
        1653985193,
        298326376,
        1316178497,
        3007786442,
        2064951626,
        458293330,
        2589141269,
        3591329599,
        3164325604,
        727753846,
        2179363840,
        146436021,
        1461446943,
        4069977195,
        705550613,
        3059967265,
        3887724982,
        4281599278,
        3313849956,
        1404054877,
        2845806497,
        146425753,
        1854211946,
        1266315497,
        3048417604,
        3681880366,
        3289982499,
        290971e4,
        1235738493,
        2632868024,
        2414719590,
        3970600049,
        1771706367,
        1449415276,
        3266420449,
        422970021,
        1963543593,
        2690192192,
        3826793022,
        1062508698,
        1531092325,
        1804592342,
        2583117782,
        2714934279,
        4024971509,
        1294809318,
        4028980673,
        1289560198,
        2221992742,
        1669523910,
        35572830,
        157838143,
        1052438473,
        1016535060,
        1802137761,
        1753167236,
        1386275462,
        3080475397,
        2857371447,
        1040679964,
        2145300060,
        2390574316,
        1461121720,
        2956646967,
        4031777805,
        4028374788,
        33600511,
        2920084762,
        1018524850,
        629373528,
        3691585981,
        3515945977,
        2091462646,
        2486323059,
        586499841,
        988145025,
        935516892,
        3367335476,
        2599673255,
        2839830854,
        265290510,
        3972581182,
        2759138881,
        3795373465,
        1005194799,
        847297441,
        406762289,
        1314163512,
        1332590856,
        1866599683,
        4127851711,
        750260880,
        613907577,
        1450815602,
        3165620655,
        3734664991,
        3650291728,
        3012275730,
        3704569646,
        1427272223,
        778793252,
        1343938022,
        2676280711,
        2052605720,
        1946737175,
        3164576444,
        3914038668,
        3967478842,
        3682934266,
        1661551462,
        3294938066,
        4011595847,
        840292616,
        3712170807,
        616741398,
        312560963,
        711312465,
        1351876610,
        322626781,
        1910503582,
        271666773,
        2175563734,
        1594956187,
        70604529,
        3617834859,
        1007753275,
        1495573769,
        4069517037,
        2549218298,
        2663038764,
        504708206,
        2263041392,
        3941167025,
        2249088522,
        1514023603,
        1998579484,
        1312622330,
        694541497,
        2582060303,
        2151582166,
        1382467621,
        776784248,
        2618340202,
        3323268794,
        2497899128,
        2784771155,
        503983604,
        4076293799,
        907881277,
        423175695,
        432175456,
        1378068232,
        4145222326,
        3954048622,
        3938656102,
        3820766613,
        2793130115,
        2977904593,
        26017576,
        3274890735,
        3194772133,
        1700274565,
        1756076034,
        4006520079,
        3677328699,
        720338349,
        1533947780,
        354530856,
        688349552,
        3973924725,
        1637815568,
        332179504,
        3949051286,
        53804574,
        2852348879,
        3044236432,
        1282449977,
        3583942155,
        3416972820,
        4006381244,
        1617046695,
        2628476075,
        3002303598,
        1686838959,
        431878346,
        2686675385,
        1700445008,
        1080580658,
        1009431731,
        832498133,
        3223435511,
        2605976345,
        2271191193,
        2516031870,
        1648197032,
        4164389018,
        2548247927,
        300782431,
        375919233,
        238389289,
        3353747414,
        2531188641,
        2019080857,
        1475708069,
        455242339,
        2609103871,
        448939670,
        3451063019,
        1395535956,
        2413381860,
        1841049896,
        1491858159,
        885456874,
        4264095073,
        4001119347,
        1565136089,
        3898914787,
        1108368660,
        540939232,
        1173283510,
        2745871338,
        3681308437,
        4207628240,
        3343053890,
        4016749493,
        1699691293,
        1103962373,
        3625875870,
        2256883143,
        3830138730,
        1031889488,
        3479347698,
        1535977030,
        4236805024,
        3251091107,
        2132092099,
        1774941330,
        1199868427,
        1452454533,
        157007616,
        2904115357,
        342012276,
        595725824,
        1480756522,
        206960106,
        497939518,
        591360097,
        863170706,
        2375253569,
        3596610801,
        1814182875,
        2094937945,
        3421402208,
        1082520231,
        3463918190,
        2785509508,
        435703966,
        3908032597,
        1641649973,
        2842273706,
        3305899714,
        1510255612,
        2148256476,
        2655287854,
        3276092548,
        4258621189,
        236887753,
        3681803219,
        274041037,
        1734335097,
        3815195456,
        3317970021,
        1899903192,
        1026095262,
        4050517792,
        356393447,
        2410691914,
        3873677099,
        3682840055,
        3913112168,
        2491498743,
        4132185628,
        2489919796,
        1091903735,
        1979897079,
        3170134830,
        3567386728,
        3557303409,
        857797738,
        1136121015,
        1342202287,
        507115054,
        2535736646,
        337727348,
        3213592640,
        1301675037,
        2528481711,
        1895095763,
        1721773893,
        3216771564,
        62756741,
        2142006736,
        835421444,
        2531993523,
        1442658625,
        3659876326,
        2882144922,
        676362277,
        1392781812,
        170690266,
        3921047035,
        1759253602,
        3611846912,
        1745797284,
        664899054,
        1329594018,
        3901205900,
        3045908486,
        2062866102,
        2865634940,
        3543621612,
        3464012697,
        1080764994,
        553557557,
        3656615353,
        3996768171,
        991055499,
        499776247,
        1265440854,
        648242737,
        3940784050,
        980351604,
        3713745714,
        1749149687,
        3396870395,
        4211799374,
        3640570775,
        1161844396,
        3125318951,
        1431517754,
        545492359,
        4268468663,
        3499529547,
        1437099964,
        2702547544,
        3433638243,
        2581715763,
        2787789398,
        1060185593,
        1593081372,
        2418618748,
        4260947970,
        69676912,
        2159744348,
        86519011,
        2512459080,
        3838209314,
        1220612927,
        3339683548,
        133810670,
        1090789135,
        1078426020,
        1569222167,
        845107691,
        3583754449,
        4072456591,
        1091646820,
        628848692,
        1613405280,
        3757631651,
        526609435,
        236106946,
        48312990,
        2942717905,
        3402727701,
        1797494240,
        859738849,
        992217954,
        4005476642,
        2243076622,
        3870952857,
        3732016268,
        765654824,
        3490871365,
        2511836413,
        1685915746,
        3888969200,
        1414112111,
        2273134842,
        3281911079,
        4080962846,
        172450625,
        2569994100,
        980381355,
        4109958455,
        2819808352,
        2716589560,
        2568741196,
        3681446669,
        3329971472,
        1835478071,
        660984891,
        3704678404,
        4045999559,
        3422617507,
        3040415634,
        1762651403,
        1719377915,
        3470491036,
        2693910283,
        3642056355,
        3138596744,
        1364962596,
        2073328063,
        1983633131,
        926494387,
        3423689081,
        2150032023,
        4096667949,
        1749200295,
        3328846651,
        309677260,
        2016342300,
        1779581495,
        3079819751,
        111262694,
        1274766160,
        443224088,
        298511866,
        1025883608,
        3806446537,
        1145181785,
        168956806,
        3641502830,
        3584813610,
        1689216846,
        3666258015,
        3200248200,
        1692713982,
        2646376535,
        4042768518,
        1618508792,
        1610833997,
        3523052358,
        4130873264,
        2001055236,
        3610705100,
        2202168115,
        4028541809,
        2961195399,
        1006657119,
        2006996926,
        3186142756,
        1430667929,
        3210227297,
        1314452623,
        4074634658,
        4101304120,
        2273951170,
        1399257539,
        3367210612,
        3027628629,
        1190975929,
        2062231137,
        2333990788,
        2221543033,
        2438960610,
        1181637006,
        548689776,
        2362791313,
        3372408396,
        3104550113,
        3145860560,
        296247880,
        1970579870,
        3078560182,
        3769228297,
        1714227617,
        3291629107,
        3898220290,
        166772364,
        1251581989,
        493813264,
        448347421,
        195405023,
        2709975567,
        677966185,
        3703036547,
        1463355134,
        2715995803,
        1338867538,
        1343315457,
        2802222074,
        2684532164,
        233230375,
        2599980071,
        2000651841,
        3277868038,
        1638401717,
        4028070440,
        3237316320,
        6314154,
        819756386,
        300326615,
        590932579,
        1405279636,
        3267499572,
        3150704214,
        2428286686,
        3959192993,
        3461946742,
        1862657033,
        1266418056,
        963775037,
        2089974820,
        2263052895,
        1917689273,
        448879540,
        3550394620,
        3981727096,
        150775221,
        3627908307,
        1303187396,
        508620638,
        2975983352,
        2726630617,
        1817252668,
        1876281319,
        1457606340,
        908771278,
        3720792119,
        3617206836,
        2455994898,
        1729034894,
        1080033504,
        976866871,
        3556439503,
        2881648439,
        1522871579,
        1555064734,
        1336096578,
        3548522304,
        2579274686,
        3574697629,
        3205460757,
        3593280638,
        3338716283,
        3079412587,
        564236357,
        2993598910,
        1781952180,
        1464380207,
        3163844217,
        3332601554,
        1699332808,
        1393555694,
        1183702653,
        3581086237,
        1288719814,
        691649499,
        2847557200,
        2895455976,
        3193889540,
        2717570544,
        1781354906,
        1676643554,
        2592534050,
        3230253752,
        1126444790,
        2770207658,
        2633158820,
        2210423226,
        2615765581,
        2414155088,
        3127139286,
        673620729,
        2805611233,
        1269405062,
        4015350505,
        3341807571,
        4149409754,
        1057255273,
        2012875353,
        2162469141,
        2276492801,
        2601117357,
        993977747,
        3918593370,
        2654263191,
        753973209,
        36408145,
        2530585658,
        25011837,
        3520020182,
        2088578344,
        530523599,
        2918365339,
        1524020338,
        1518925132,
        3760827505,
        3759777254,
        1202760957,
        3985898139,
        3906192525,
        674977740,
        4174734889,
        2031300136,
        2019492241,
        3983892565,
        4153806404,
        3822280332,
        352677332,
        2297720250,
        60907813,
        90501309,
        3286998549,
        1016092578,
        2535922412,
        2839152426,
        457141659,
        509813237,
        4120667899,
        652014361,
        1966332200,
        2975202805,
        55981186,
        2327461051,
        676427537,
        3255491064,
        2882294119,
        3433927263,
        1307055953,
        942726286,
        933058658,
        2468411793,
        3933900994,
        4215176142,
        1361170020,
        2001714738,
        2830558078,
        3274259782,
        1222529897,
        1679025792,
        2729314320,
        3714953764,
        1770335741,
        151462246,
        3013232138,
        1682292957,
        1483529935,
        471910574,
        1539241949,
        458788160,
        3436315007,
        1807016891,
        3718408830,
        978976581,
        1043663428,
        3165965781,
        1927990952,
        4200891579,
        2372276910,
        3208408903,
        3533431907,
        1412390302,
        2931980059,
        4132332400,
        1947078029,
        3881505623,
        4168226417,
        2941484381,
        1077988104,
        1320477388,
        886195818,
        18198404,
        3786409e3,
        2509781533,
        112762804,
        3463356488,
        1866414978,
        891333506,
        18488651,
        661792760,
        1628790961,
        3885187036,
        3141171499,
        876946877,
        2693282273,
        1372485963,
        791857591,
        2686433993,
        3759982718,
        3167212022,
        3472953795,
        2716379847,
        445679433,
        3561995674,
        3504004811,
        3574258232,
        54117162,
        3331405415,
        2381918588,
        3769707343,
        4154350007,
        1140177722,
        4074052095,
        668550556,
        3214352940,
        367459370,
        261225585,
        2610173221,
        4209349473,
        3468074219,
        3265815641,
        314222801,
        3066103646,
        3808782860,
        282218597,
        3406013506,
        3773591054,
        379116347,
        1285071038,
        846784868,
        2669647154,
        3771962079,
        3550491691,
        2305946142,
        453669953,
        1268987020,
        3317592352,
        3279303384,
        3744833421,
        2610507566,
        3859509063,
        266596637,
        3847019092,
        517658769,
        3462560207,
        3443424879,
        370717030,
        4247526661,
        2224018117,
        4143653529,
        4112773975,
        2788324899,
        2477274417,
        1456262402,
        2901442914,
        1517677493,
        1846949527,
        2295493580,
        3734397586,
        2176403920,
        1280348187,
        1908823572,
        3871786941,
        846861322,
        1172426758,
        3287448474,
        3383383037,
        1655181056,
        3139813346,
        901632758,
        1897031941,
        2986607138,
        3066810236,
        3447102507,
        1393639104,
        373351379,
        950779232,
        625454576,
        3124240540,
        4148612726,
        2007998917,
        544563296,
        2244738638,
        2330496472,
        2058025392,
        1291430526,
        424198748,
        50039436,
        29584100,
        3605783033,
        2429876329,
        2791104160,
        1057563949,
        3255363231,
        3075367218,
        3463963227,
        1469046755,
        985887462
      ];
      var C_ORIG = [
        1332899944,
        1700884034,
        1701343084,
        1684370003,
        1668446532,
        1869963892
      ];
      function _encipher(lr, off, P, S) {
        var n, l = lr[off], r = lr[off + 1];
        l ^= P[0];
        n = S[l >>> 24];
        n += S[256 | l >> 16 & 255];
        n ^= S[512 | l >> 8 & 255];
        n += S[768 | l & 255];
        r ^= n ^ P[1];
        n = S[r >>> 24];
        n += S[256 | r >> 16 & 255];
        n ^= S[512 | r >> 8 & 255];
        n += S[768 | r & 255];
        l ^= n ^ P[2];
        n = S[l >>> 24];
        n += S[256 | l >> 16 & 255];
        n ^= S[512 | l >> 8 & 255];
        n += S[768 | l & 255];
        r ^= n ^ P[3];
        n = S[r >>> 24];
        n += S[256 | r >> 16 & 255];
        n ^= S[512 | r >> 8 & 255];
        n += S[768 | r & 255];
        l ^= n ^ P[4];
        n = S[l >>> 24];
        n += S[256 | l >> 16 & 255];
        n ^= S[512 | l >> 8 & 255];
        n += S[768 | l & 255];
        r ^= n ^ P[5];
        n = S[r >>> 24];
        n += S[256 | r >> 16 & 255];
        n ^= S[512 | r >> 8 & 255];
        n += S[768 | r & 255];
        l ^= n ^ P[6];
        n = S[l >>> 24];
        n += S[256 | l >> 16 & 255];
        n ^= S[512 | l >> 8 & 255];
        n += S[768 | l & 255];
        r ^= n ^ P[7];
        n = S[r >>> 24];
        n += S[256 | r >> 16 & 255];
        n ^= S[512 | r >> 8 & 255];
        n += S[768 | r & 255];
        l ^= n ^ P[8];
        n = S[l >>> 24];
        n += S[256 | l >> 16 & 255];
        n ^= S[512 | l >> 8 & 255];
        n += S[768 | l & 255];
        r ^= n ^ P[9];
        n = S[r >>> 24];
        n += S[256 | r >> 16 & 255];
        n ^= S[512 | r >> 8 & 255];
        n += S[768 | r & 255];
        l ^= n ^ P[10];
        n = S[l >>> 24];
        n += S[256 | l >> 16 & 255];
        n ^= S[512 | l >> 8 & 255];
        n += S[768 | l & 255];
        r ^= n ^ P[11];
        n = S[r >>> 24];
        n += S[256 | r >> 16 & 255];
        n ^= S[512 | r >> 8 & 255];
        n += S[768 | r & 255];
        l ^= n ^ P[12];
        n = S[l >>> 24];
        n += S[256 | l >> 16 & 255];
        n ^= S[512 | l >> 8 & 255];
        n += S[768 | l & 255];
        r ^= n ^ P[13];
        n = S[r >>> 24];
        n += S[256 | r >> 16 & 255];
        n ^= S[512 | r >> 8 & 255];
        n += S[768 | r & 255];
        l ^= n ^ P[14];
        n = S[l >>> 24];
        n += S[256 | l >> 16 & 255];
        n ^= S[512 | l >> 8 & 255];
        n += S[768 | l & 255];
        r ^= n ^ P[15];
        n = S[r >>> 24];
        n += S[256 | r >> 16 & 255];
        n ^= S[512 | r >> 8 & 255];
        n += S[768 | r & 255];
        l ^= n ^ P[16];
        lr[off] = r ^ P[BLOWFISH_NUM_ROUNDS + 1];
        lr[off + 1] = l;
        return lr;
      }
      __name(_encipher, "_encipher");
      function _streamtoword(data, offp) {
        for (var i = 0, word = 0; i < 4; ++i)
          word = word << 8 | data[offp] & 255, offp = (offp + 1) % data.length;
        return { key: word, offp };
      }
      __name(_streamtoword, "_streamtoword");
      function _key(key, P, S) {
        var offset = 0, lr = [0, 0], plen = P.length, slen = S.length, sw;
        for (var i = 0; i < plen; i++)
          sw = _streamtoword(key, offset), offset = sw.offp, P[i] = P[i] ^ sw.key;
        for (i = 0; i < plen; i += 2)
          lr = _encipher(lr, 0, P, S), P[i] = lr[0], P[i + 1] = lr[1];
        for (i = 0; i < slen; i += 2)
          lr = _encipher(lr, 0, P, S), S[i] = lr[0], S[i + 1] = lr[1];
      }
      __name(_key, "_key");
      function _ekskey(data, key, P, S) {
        var offp = 0, lr = [0, 0], plen = P.length, slen = S.length, sw;
        for (var i = 0; i < plen; i++)
          sw = _streamtoword(key, offp), offp = sw.offp, P[i] = P[i] ^ sw.key;
        offp = 0;
        for (i = 0; i < plen; i += 2)
          sw = _streamtoword(data, offp), offp = sw.offp, lr[0] ^= sw.key, sw = _streamtoword(data, offp), offp = sw.offp, lr[1] ^= sw.key, lr = _encipher(lr, 0, P, S), P[i] = lr[0], P[i + 1] = lr[1];
        for (i = 0; i < slen; i += 2)
          sw = _streamtoword(data, offp), offp = sw.offp, lr[0] ^= sw.key, sw = _streamtoword(data, offp), offp = sw.offp, lr[1] ^= sw.key, lr = _encipher(lr, 0, P, S), S[i] = lr[0], S[i + 1] = lr[1];
      }
      __name(_ekskey, "_ekskey");
      function _crypt(b, salt, rounds, callback, progressCallback) {
        var cdata = C_ORIG.slice(), clen = cdata.length, err;
        if (rounds < 4 || rounds > 31) {
          err = Error("Illegal number of rounds (4-31): " + rounds);
          if (callback) {
            nextTick(callback.bind(this, err));
            return;
          } else
            throw err;
        }
        if (salt.length !== BCRYPT_SALT_LEN) {
          err = Error("Illegal salt length: " + salt.length + " != " + BCRYPT_SALT_LEN);
          if (callback) {
            nextTick(callback.bind(this, err));
            return;
          } else
            throw err;
        }
        rounds = 1 << rounds >>> 0;
        var P, S, i = 0, j;
        if (Int32Array) {
          P = new Int32Array(P_ORIG);
          S = new Int32Array(S_ORIG);
        } else {
          P = P_ORIG.slice();
          S = S_ORIG.slice();
        }
        _ekskey(salt, b, P, S);
        function next() {
          if (progressCallback)
            progressCallback(i / rounds);
          if (i < rounds) {
            var start = Date.now();
            for (; i < rounds; ) {
              i = i + 1;
              _key(b, P, S);
              _key(salt, P, S);
              if (Date.now() - start > MAX_EXECUTION_TIME)
                break;
            }
          } else {
            for (i = 0; i < 64; i++)
              for (j = 0; j < clen >> 1; j++)
                _encipher(cdata, j << 1, P, S);
            var ret = [];
            for (i = 0; i < clen; i++)
              ret.push((cdata[i] >> 24 & 255) >>> 0), ret.push((cdata[i] >> 16 & 255) >>> 0), ret.push((cdata[i] >> 8 & 255) >>> 0), ret.push((cdata[i] & 255) >>> 0);
            if (callback) {
              callback(null, ret);
              return;
            } else
              return ret;
          }
          if (callback)
            nextTick(next);
        }
        __name(next, "next");
        if (typeof callback !== "undefined") {
          next();
        } else {
          var res;
          while (true)
            if (typeof (res = next()) !== "undefined")
              return res || [];
        }
      }
      __name(_crypt, "_crypt");
      function _hash(s, salt, callback, progressCallback) {
        var err;
        if (typeof s !== "string" || typeof salt !== "string") {
          err = Error("Invalid string / salt: Not a string");
          if (callback) {
            nextTick(callback.bind(this, err));
            return;
          } else
            throw err;
        }
        var minor, offset;
        if (salt.charAt(0) !== "$" || salt.charAt(1) !== "2") {
          err = Error("Invalid salt version: " + salt.substring(0, 2));
          if (callback) {
            nextTick(callback.bind(this, err));
            return;
          } else
            throw err;
        }
        if (salt.charAt(2) === "$")
          minor = String.fromCharCode(0), offset = 3;
        else {
          minor = salt.charAt(2);
          if (minor !== "a" && minor !== "b" && minor !== "y" || salt.charAt(3) !== "$") {
            err = Error("Invalid salt revision: " + salt.substring(2, 4));
            if (callback) {
              nextTick(callback.bind(this, err));
              return;
            } else
              throw err;
          }
          offset = 4;
        }
        if (salt.charAt(offset + 2) > "$") {
          err = Error("Missing salt rounds");
          if (callback) {
            nextTick(callback.bind(this, err));
            return;
          } else
            throw err;
        }
        var r1 = parseInt(salt.substring(offset, offset + 1), 10) * 10, r2 = parseInt(salt.substring(offset + 1, offset + 2), 10), rounds = r1 + r2, real_salt = salt.substring(offset + 3, offset + 25);
        s += minor >= "a" ? "\0" : "";
        var passwordb = stringToBytes(s), saltb = base64_decode(real_salt, BCRYPT_SALT_LEN);
        function finish(bytes) {
          var res = [];
          res.push("$2");
          if (minor >= "a")
            res.push(minor);
          res.push("$");
          if (rounds < 10)
            res.push("0");
          res.push(rounds.toString());
          res.push("$");
          res.push(base64_encode(saltb, saltb.length));
          res.push(base64_encode(bytes, C_ORIG.length * 4 - 1));
          return res.join("");
        }
        __name(finish, "finish");
        if (typeof callback == "undefined")
          return finish(_crypt(passwordb, saltb, rounds));
        else {
          _crypt(passwordb, saltb, rounds, function(err2, bytes) {
            if (err2)
              callback(err2, null);
            else
              callback(null, finish(bytes));
          }, progressCallback);
        }
      }
      __name(_hash, "_hash");
      bcrypt2.encodeBase64 = base64_encode;
      bcrypt2.decodeBase64 = base64_decode;
      return bcrypt2;
    });
  }
});

// .wrangler/tmp/bundle-L0oFto/middleware-loader.entry.ts
init_modules_watch_stub();

// .wrangler/tmp/bundle-L0oFto/middleware-insertion-facade.js
init_modules_watch_stub();

// src/index.ts
init_modules_watch_stub();
var import_bcryptjs = __toESM(require_bcrypt(), 1);
var NOTA_STATUSES = [
  "Criado",
  "Novo",
  "Programado",
  "Ag. Material",
  "Ag",
  "Plano",
  "Cancelado"
];
function normalizeNotaStatus(value) {
  const normalized = String(value ?? "").trim();
  if (NOTA_STATUSES.includes(normalized)) {
    return normalized;
  }
  return null;
}
__name(normalizeNotaStatus, "normalizeNotaStatus");
var PARAMETRO_TIPOS = [
  "Status_ativo",
  "Monitorado",
  "Sub",
  "Ciclo",
  "Tolerancia",
  "Classe",
  "Grupo",
  "ModeloPoste",
  "ModeloRele",
  "DDSmodelo",
  "CaixaModelo"
];
var parametrosTableEnsured = false;
async function ensureParametrosTable(env) {
  if (parametrosTableEnsured) return;
  await env.DB.prepare(
    `CREATE TABLE IF NOT EXISTS tb_parametro (
       id_parametro TEXT PRIMARY KEY,
       company_id TEXT NOT NULL,
       tipo_parametro TEXT NOT NULL,
       valor TEXT NOT NULL,
       ativo INTEGER NOT NULL DEFAULT 1,
       ordem INTEGER,
       observacao TEXT,
       created_at TEXT NOT NULL,
       updated_at TEXT NOT NULL
     )`
  ).run();
  await env.DB.prepare(
    `CREATE INDEX IF NOT EXISTS idx_parametro_company
     ON tb_parametro (company_id, tipo_parametro)`
  ).run();
  parametrosTableEnsured = true;
}
__name(ensureParametrosTable, "ensureParametrosTable");
var DEFAULT_JWT_EXP_MINUTES = 30;
var DEFAULT_MAX_ATTEMPTS = 5;
var DEFAULT_LOCK_MINUTES = 15;
var SESSION_COOKIE_NAME = "tecrail_session";
var SESSION_REFRESH_THRESHOLD_MINUTES = 5;
var pendingSessionRefresh = /* @__PURE__ */ new WeakMap();
function scheduleSessionRefresh(request, token, maxAgeSeconds) {
  pendingSessionRefresh.set(request, { token, maxAgeSeconds });
}
__name(scheduleSessionRefresh, "scheduleSessionRefresh");
var src_default = {
  async fetch(request, env) {
    const respond = /* @__PURE__ */ __name((response, _env) => {
      const refreshMeta = pendingSessionRefresh.get(request);
      if (refreshMeta) {
        response.headers.append(
          "Set-Cookie",
          buildSessionCookie(refreshMeta.token, request, refreshMeta.maxAgeSeconds)
        );
        pendingSessionRefresh.delete(request);
      }
      return withCors(response, env, request);
    }, "respond");
    try {
      if (request.method === "OPTIONS") {
        return respond(new Response(null, { status: 204 }));
      }
      const url = new URL(request.url);
      const routeKey = `${request.method.toUpperCase()} ${url.pathname}`;
      switch (routeKey) {
        case "GET /":
          return respond(
            Response.json({
              status: "ok",
              routes: [
                "/health",
                "/db/health",
                "/auth/login",
                "/auth/me",
                "/auth/permissions",
                "/admin/users",
                "/admin/profiles",
                "/admin/profiles/history",
                "/estrutura",
                "/estrutura/history",
                "/ativos",
                "/ativos/detail",
                "/ativos/history",
                "/componentes",
                "/componentes/detail",
                "/componentes/historico/manutencao",
                "/componentes/historico/alteracao",
                "/notas",
                "/notas/detail",
                "/notas/historico/alteracao",
                "/os",
                "/os/detail",
                "/os/history",
                "/os/scheduler-config",
                "/os/scheduler-team-config",
                "/os/scheduler-sub-team",
                "/os/scheduler-assignment",
                "/os/scheduler-holiday"
              ]
            }),
            env
          );
        case "GET /health":
          return respond(
            Response.json({ status: "ok", service: "tecrail-worker" }),
            env
          );
        case "GET /db/health":
          return respond(await handleDbHealth(env), env);
        case "POST /auth/login":
          return respond(await handleLogin(request, env), env);
        case "GET /auth/me":
          return respond(await handleAuthMe(request, env), env);
        case "GET /auth/permissions":
          return respond(await handleAuthPermissions(request, env), env);
        case "POST /auth/logout":
          return respond(await handleLogout(request, env), env);
        case "POST /admin/users":
          return respond(await handleCreateUser(request, env), env);
        case "GET /admin/users":
          return respond(await handleListUsers(request, env), env);
        case "PATCH /admin/users":
          return respond(await handleUpdateUser(request, env), env);
        case "GET /admin/users/history":
          return respond(await handleUserHistory(request, env), env);
        case "GET /admin/profiles":
          return respond(await handleListProfiles(request, env), env);
        case "POST /admin/profiles":
          return respond(await handleCreateProfile(request, env), env);
        case "PATCH /admin/profiles":
          return respond(await handleUpdateProfile(request, env), env);
        case "GET /admin/profiles/history":
          return respond(await handleProfileHistory(request, env), env);
        case "GET /estrutura":
          return respond(await handleListEstrutura(request, env), env);
        case "POST /estrutura":
          return respond(await handleCreateEstrutura(request, env), env);
        case "PATCH /estrutura":
          return respond(await handleUpdateEstrutura(request, env), env);
        case "GET /estrutura/history":
          return respond(await handleEstruturaHistory(request, env), env);
        case "GET /parametros":
          return respond(await handleListParametros(request, env), env);
        case "POST /parametros":
          return respond(await handleCreateParametro(request, env), env);
        case "PATCH /parametros":
          return respond(await handleUpdateParametro(request, env), env);
        case "GET /ativos":
          return respond(await handleListAtivos(request, env), env);
        case "GET /ativos/detail":
          return respond(await handleGetAtivo(request, env), env);
        case "POST /ativos":
          return respond(await handleCreateAtivo(request, env), env);
        case "PATCH /ativos":
          return respond(await handleUpdateAtivo(request, env), env);
        case "GET /ativos/status-history":
          return respond(await handleAtivoStatusHistory(request, env), env);
        case "GET /ativos/history":
          return respond(await handleAtivoHistory(request, env), env);
        case "GET /componentes":
          return respond(await handleListComponentes(request, env), env);
        case "GET /componentes/detail":
          return respond(await handleGetComponenteDetail(request, env), env);
        case "GET /componentes/historico/manutencao":
          return respond(
            await handleComponentesMaintenanceHistory(request, env),
            env
          );
        case "GET /componentes/historico/alteracao":
          return respond(
            await handleComponentesChangeHistory(request, env),
            env
          );
        case "POST /componentes":
          return respond(await handleCreateComponente(request, env), env);
        case "PATCH /componentes":
          return respond(await handleUpdateComponente(request, env), env);
        case "GET /notas":
          return respond(await handleListNotas(request, env), env);
        case "GET /notas/detail":
          return respond(await handleGetNotaDetail(request, env), env);
        case "GET /notas/historico/alteracao":
          return respond(await handleNotaChangeHistory(request, env), env);
        case "POST /notas":
          return respond(await handleCreateNotas(request, env), env);
        case "PATCH /notas":
          return respond(await handleUpdateNota(request, env), env);
        case "GET /tarefas":
          return respond(await handleListTarefas(request, env), env);
        case "GET /planejamento/filters":
          return respond(await handlePlanejamentoFilters(request, env), env);
        case "GET /planejamento/technicians":
          return respond(await handlePlanejamentoTechnicians(request, env), env);
        case "GET /planejamento/ativos":
          return respond(await handlePlanejamentoAssets(request, env), env);
        case "POST /tarefas":
          return respond(await handleCreateTarefa(request, env), env);
        case "PATCH /tarefas":
          return respond(await handleUpdateTarefa(request, env), env);
        case "GET /os":
          return respond(await handleListOrderService(request, env), env);
        case "GET /os/detail":
          return respond(await handleGetOrderService(request, env), env);
        case "POST /os":
          return respond(await handleCreateOrderService(request, env), env);
        case "PATCH /os":
          return respond(await handleUpdateOrderService(request, env), env);
        case "GET /os/history":
          return respond(await handleOrderServiceHistory(request, env), env);
        case "PATCH /os/bulk":
          return respond(await handleBulkUpdateOrderService(request, env), env);
        case "GET /os/scheduler-config":
          return respond(await handleGetSchedulerConfig(request, env), env);
        case "PATCH /os/scheduler-config":
          return respond(await handleUpsertSchedulerConfig(request, env), env);
        case "GET /os/scheduler-team-config":
          return respond(await handleGetSchedulerTeamConfig(request, env), env);
        case "PATCH /os/scheduler-team-config":
          return respond(await handleUpsertSchedulerTeamConfig(request, env), env);
        case "GET /os/scheduler-sub-team":
          return respond(await handleGetSchedulerSubTeamConfig(request, env), env);
        case "PATCH /os/scheduler-sub-team":
          return respond(await handleUpsertSchedulerSubTeamConfig(request, env), env);
        case "DELETE /os/scheduler-sub-team":
          return respond(await handleDeleteSchedulerSubTeamConfig(request, env), env);
        case "GET /os/scheduler-assignment":
          return respond(await handleGetSchedulerAssignments(request, env), env);
        case "PATCH /os/scheduler-assignment":
          return respond(await handleUpsertSchedulerAssignment(request, env), env);
        case "DELETE /os/scheduler-assignment":
          return respond(await handleDeleteSchedulerAssignment(request, env), env);
        case "GET /os/scheduler-holiday":
          return respond(await handleGetSchedulerHolidays(request, env), env);
        case "PATCH /os/scheduler-holiday":
          return respond(await handleUpsertSchedulerHoliday(request, env), env);
        default:
          if (routeKey.startsWith("DELETE /componentes/")) {
            return respond(await handleDeleteComponente(request, env), env);
          }
          return respond(new Response("Not Found", { status: 404 }), env);
      }
    } catch (error) {
      console.error("Unhandled worker error", error);
      return respond(
        Response.json({ error: "Erro interno." }, { status: 500 }),
        env
      );
    }
  }
};
async function handleDbHealth(env) {
  const result = await env.DB.prepare("SELECT 1 AS ok").first();
  return Response.json({ ok: result?.ok === 1 });
}
__name(handleDbHealth, "handleDbHealth");
async function handleLogin(request, env) {
  assertJwtSecret(env);
  const payload = await readJson(request);
  const clientIp = getClientIp(request);
  if (!payload) {
    await logLoginAttempt(env, {
      success: 0,
      reason: "invalid_payload",
      ip: clientIp,
      userAgent: request.headers.get("user-agent")
    });
    return Response.json({ error: "Dados invalidos." }, { status: 400 });
  }
  const cs = String(payload.cs || "").trim();
  const senha = String(payload.senha || "");
  if (!cs || !senha) {
    await logLoginAttempt(env, {
      success: 0,
      reason: "missing_fields",
      ip: clientIp,
      userAgent: request.headers.get("user-agent")
    });
    return Response.json({ error: "Empresa, CS e senha sao obrigatorios." }, { status: 400 });
  }
  const user = await env.DB.prepare(
    `SELECT u.*, c.status AS company_status, p.name AS profile_name
       FROM tb_user u
       LEFT JOIN tb_company c ON c.id = u.company_id
       LEFT JOIN tb_profile p ON p.id = u.profile_id
       WHERE u.cs = ?`
  ).bind(cs).first();
  if (!user) {
    await logLoginAttempt(env, {
      success: 0,
      reason: "user_not_found",
      companyId: null,
      userId: null,
      cs,
      ip: clientIp,
      userAgent: request.headers.get("user-agent")
    });
    return Response.json({ error: "Credenciais invalidas." }, { status: 401 });
  }
  const companyId = user.company_id;
  if (user.company_status !== "ativo") {
    await logLoginAttempt(env, {
      success: 0,
      reason: "company_inactive",
      companyId: user.company_id,
      userId: user.id,
      cs,
      ip: clientIp,
      userAgent: request.headers.get("user-agent")
    });
    return Response.json({ error: "Credenciais invalidas." }, { status: 401 });
  }
  if (user.status !== "ativo") {
    await logLoginAttempt(env, {
      success: 0,
      reason: "user_inactive",
      companyId: user.company_id,
      userId: user.id,
      cs,
      email: user.email,
      ip: clientIp,
      userAgent: request.headers.get("user-agent")
    });
    return Response.json({ error: "Credenciais invalidas." }, { status: 401 });
  }
  const auth = await env.DB.prepare(
    "SELECT user_id, password_hash, last_login_at, failed_attempts, locked_until FROM tb_user_auth WHERE user_id = ?"
  ).bind(user.id).first();
  if (!auth) {
    await logLoginAttempt(env, {
      success: 0,
      reason: "auth_missing",
      companyId,
      userId: user.id,
      cs,
      email: user.email,
      ip: clientIp,
      userAgent: request.headers.get("user-agent")
    });
    return Response.json({ error: "Credenciais invalidas." }, { status: 401 });
  }
  const now = /* @__PURE__ */ new Date();
  const lockedUntil = auth.locked_until ? new Date(auth.locked_until) : null;
  if (lockedUntil && lockedUntil.getTime() > now.getTime()) {
    await logLoginAttempt(env, {
      success: 0,
      reason: "account_locked",
      companyId,
      userId: user.id,
      cs,
      email: user.email,
      ip: clientIp,
      userAgent: request.headers.get("user-agent")
    });
    return Response.json({ error: "Conta bloqueada temporariamente." }, { status: 423 });
  }
  const passwordOk = await import_bcryptjs.default.compare(senha, auth.password_hash);
  if (!passwordOk) {
    const maxAttempts = parseInt(env.AUTH_MAX_ATTEMPTS || "", 10) || DEFAULT_MAX_ATTEMPTS;
    const lockMinutes = parseInt(env.AUTH_LOCK_MINUTES || "", 10) || DEFAULT_LOCK_MINUTES;
    const failedAttempts = (auth.failed_attempts || 0) + 1;
    const shouldLock = failedAttempts >= maxAttempts;
    const newLockedUntil = shouldLock ? new Date(now.getTime() + lockMinutes * 60 * 1e3).toISOString() : null;
    await env.DB.prepare("UPDATE tb_user_auth SET failed_attempts = ?, locked_until = ? WHERE user_id = ?").bind(failedAttempts, newLockedUntil, user.id).run();
    await logLoginAttempt(env, {
      success: 0,
      reason: shouldLock ? "account_locked" : "invalid_password",
      companyId,
      userId: user.id,
      cs,
      email: user.email,
      ip: clientIp,
      userAgent: request.headers.get("user-agent")
    });
    return Response.json({ error: "Credenciais invalidas." }, { status: 401 });
  }
  await env.DB.prepare("UPDATE tb_user_auth SET failed_attempts = 0, locked_until = NULL, last_login_at = ? WHERE user_id = ?").bind(now.toISOString(), user.id).run();
  await revokeActiveSessionsForUser(env, user.id, companyId);
  const sessionId = await createUserSession(env, companyId, user.id, clientIp);
  await logLoginAttempt(env, {
    success: 1,
    reason: "login_success",
    companyId,
    userId: user.id,
    cs,
    email: user.email,
    ip: clientIp,
    userAgent: request.headers.get("user-agent")
  });
  const expMinutes = parseInt(env.JWT_EXP_MINUTES || "", 10) || DEFAULT_JWT_EXP_MINUTES;
  const token = await signJwt(
    {
      user_id: user.id,
      company_id: companyId,
      nome: user.nome,
      cargo: user.cargo,
      equipe: user.equipe,
      session_id: sessionId
    },
    env.JWT_SECRET,
    expMinutes
  );
  const cookie = buildSessionCookie(token, request, expMinutes * 60);
  const response = Response.json({
    token,
    user: {
      id: user.id,
      company_id: companyId,
      nome: user.nome,
      email: user.email,
      cargo: user.cargo,
      equipe: user.equipe,
      profile_id: user.profile_id,
      profile_name: user.profile_name
    }
  });
  response.headers.set("Set-Cookie", cookie);
  return response;
}
__name(handleLogin, "handleLogin");
async function handleAuthMe(request, env) {
  assertJwtSecret(env);
  const auth = await requireAuth(request, env);
  if (!auth) {
    return Response.json({ error: "Token invalido." }, { status: 401 });
  }
  const user = await env.DB.prepare(
    `SELECT u.id, u.company_id, u.nome, u.email, u.cargo, u.equipe, u.profile_id,
              p.name AS profile_name
       FROM tb_user u
       LEFT JOIN tb_profile p ON p.id = u.profile_id
       WHERE u.id = ? AND u.company_id = ?`
  ).bind(auth.user_id, auth.company_id).first();
  if (!user || user.status !== "ativo") {
    return Response.json({ error: "Usuario inativo." }, { status: 401 });
  }
  return Response.json({
    user: {
      id: user.id,
      company_id: user.company_id,
      nome: user.nome,
      email: user.email,
      cargo: user.cargo,
      equipe: user.equipe,
      profile_id: user.profile_id,
      profile_name: user.profile_name
    }
  });
}
__name(handleAuthMe, "handleAuthMe");
async function handleAuthPermissions(request, env) {
  assertJwtSecret(env);
  const auth = await requireAuth(request, env);
  if (!auth) {
    return Response.json({ error: "Token invalido." }, { status: 401 });
  }
  const result = await env.DB.prepare(
    `SELECT perm.screen_id, perm.leitura, perm.criacao, perm.edicao, perm.exclusao
     FROM tb_user u
     LEFT JOIN tb_profile p ON p.id = u.profile_id
     LEFT JOIN tb_profile_permission perm ON perm.profile_id = u.profile_id
     WHERE u.id = ? AND u.company_id = ? AND p.status = 'ativo'`
  ).bind(auth.user_id, auth.company_id).all();
  const permissions = {};
  for (const row of result.results) {
    if (!row.screen_id) continue;
    permissions[row.screen_id] = {
      leitura: row.leitura === 1,
      criacao: row.criacao === 1,
      edicao: row.edicao === 1,
      exclusao: row.exclusao === 1
    };
  }
  return Response.json({ permissions });
}
__name(handleAuthPermissions, "handleAuthPermissions");
async function handleLogout(request, env) {
  assertJwtSecret(env);
  const auth = await requireAuth(request, env);
  if (auth) {
    await revokeSession(env, auth.session_id, auth.company_id, auth.user_id);
  }
  const cookie = buildSessionCookie("", request, 0);
  const response = Response.json({ ok: true });
  response.headers.set("Set-Cookie", cookie);
  return response;
}
__name(handleLogout, "handleLogout");
async function handleCreateUser(request, env) {
  assertJwtSecret(env);
  const auth = await requireAuth(request, env);
  if (!auth) {
    return Response.json({ error: "Token invalido." }, { status: 401 });
  }
  const permissionError = await requirePermission(
    env,
    auth,
    "configuracao",
    "criacao"
  );
  if (permissionError) return permissionError;
  const payload = await readJson(request);
  if (!payload) {
    return Response.json({ error: "Dados invalidos." }, { status: 400 });
  }
  const nome = String(payload.nome || "").trim();
  const cs = String(payload.cs || "").trim();
  const email = String(payload.email || "").trim().toLowerCase();
  const escala = normalizeEscala(String(payload.escala || ""));
  const profileId = payload.profile_id ? String(payload.profile_id).trim() : "";
  const cargo = payload.cargo ? String(payload.cargo).trim() : null;
  const coordenacao = payload.coordenacao ? String(payload.coordenacao).trim() : null;
  const equipe = payload.equipe ? String(payload.equipe).trim() : null;
  const equipeAditiva = payload.equipe_aditiva ? String(payload.equipe_aditiva).trim() : null;
  const status = normalizeStatus(String(payload.status || "ativo"));
  const senha = String(payload.senha || "");
  if (!nome || !cs || !email || !senha || !escala || !profileId) {
    return Response.json(
      { error: "Nome, CS, email, escala, perfil e senha sao obrigatorios." },
      { status: 400 }
    );
  }
  if (!isValidEmail(email)) {
    return Response.json({ error: "Email invalido." }, { status: 400 });
  }
  if (!isPasswordValid(senha)) {
    return Response.json(
      {
        error: "Senha invalida. Minimo 7 caracteres, 1 letra, 1 numero e 1 especial (!@#$%&)."
      },
      { status: 400 }
    );
  }
  if (!status) {
    return Response.json({ error: "Status invalido." }, { status: 400 });
  }
  if (!escala) {
    return Response.json({ error: "Escala invalida." }, { status: 400 });
  }
  if (!isValidCs(cs)) {
    return Response.json({ error: "CS deve conter 6 digitos." }, { status: 400 });
  }
  const profile = await env.DB.prepare(
    "SELECT id, status FROM tb_profile WHERE id = ? AND company_id = ?"
  ).bind(profileId, auth.company_id).first();
  if (!profile || profile.status !== "ativo") {
    return Response.json({ error: "Perfil invalido." }, { status: 400 });
  }
  const company = await env.DB.prepare(
    "SELECT id, status FROM tb_company WHERE id = ?"
  ).bind(auth.company_id).first();
  if (!company || company.status !== "ativo") {
    return Response.json({ error: "Empresa invalida." }, { status: 400 });
  }
  const existing = await env.DB.prepare(
    "SELECT id FROM tb_user WHERE company_id = ? AND (cs = ? OR email = ? OR nome = ?)"
  ).bind(auth.company_id, cs, email, nome).first();
  if (existing) {
    return Response.json({ error: "Usuario ja existe." }, { status: 409 });
  }
  const userId = crypto.randomUUID();
  const passwordHash = await import_bcryptjs.default.hash(senha, 10);
  await env.DB.prepare(
    `INSERT INTO tb_user (
      id, company_id, nome, cs, email, escala, profile_id, cargo, coordenacao, equipe, equipe_aditiva, status, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`
  ).bind(
    userId,
    auth.company_id,
    nome,
    cs,
    email,
    escala,
    profileId,
    cargo,
    coordenacao,
    equipe,
    equipeAditiva,
    status
  ).run();
  await env.DB.prepare(
    "INSERT INTO tb_user_auth (user_id, password_hash) VALUES (?, ?)"
  ).bind(userId, passwordHash).run();
  await logUserHistory(env, {
    companyId: auth.company_id,
    userId,
    changedByUserId: auth.user_id,
    changedByName: auth.nome,
    changes: "Usuario criado"
  });
  const user = await env.DB.prepare(
    `SELECT u.id, u.company_id, u.nome, u.cs, u.email, u.escala, u.profile_id,
            p.name AS profile_name, u.cargo, u.coordenacao, u.equipe, u.equipe_aditiva,
            u.status, u.created_at, u.updated_at
     FROM tb_user u
     LEFT JOIN tb_profile p ON p.id = u.profile_id
     WHERE u.id = ? AND u.company_id = ?`
  ).bind(userId, auth.company_id).first();
  return Response.json({ user }, { status: 201 });
}
__name(handleCreateUser, "handleCreateUser");
async function handleListUsers(request, env) {
  assertJwtSecret(env);
  const auth = await requireAuth(request, env);
  if (!auth) {
    return Response.json({ error: "Token invalido." }, { status: 401 });
  }
  const permissionError = await requirePermission(
    env,
    auth,
    "configuracao",
    "leitura"
  );
  if (permissionError) return permissionError;
  const result = await env.DB.prepare(
    `SELECT u.id, u.company_id, u.nome, u.cs, u.email, u.escala, u.profile_id,
            p.name AS profile_name, u.cargo, u.coordenacao, u.equipe, u.equipe_aditiva,
            u.status, u.created_at, u.updated_at
     FROM tb_user u
     LEFT JOIN tb_profile p ON p.id = u.profile_id
     WHERE u.company_id = ?
     ORDER BY u.created_at DESC`
  ).bind(auth.company_id).all();
  return Response.json({ users: result.results });
}
__name(handleListUsers, "handleListUsers");
async function handlePlanejamentoFilters(request, env) {
  assertJwtSecret(env);
  const auth = await requireAuth(request, env);
  if (!auth) {
    return Response.json({ error: "Token invalido." }, { status: 401 });
  }
  const result = await env.DB.prepare(
    `SELECT
            TRIM(coordenacao) AS coordenacao,
            TRIM(equipe) AS equipe
     FROM tb_estrutura
     WHERE company_id = ?
       AND status = 'ativo'
       AND coordenacao IS NOT NULL
       AND TRIM(coordenacao) != ''
       AND equipe IS NOT NULL
       AND TRIM(equipe) != ''
     ORDER BY coordenacao, equipe`
  ).bind(auth.company_id).all();
  const combos = result.results.filter(
    (row) => row.coordenacao && row.equipe
  );
  const coordenacoes = Array.from(
    new Set(combos.map((row) => row.coordenacao))
  ).sort();
  const equipesByCoord = {};
  for (const row of combos) {
    if (!row.coordenacao) continue;
    if (!equipesByCoord[row.coordenacao]) {
      equipesByCoord[row.coordenacao] = [];
    }
    if (!equipesByCoord[row.coordenacao].includes(row.equipe)) {
      equipesByCoord[row.coordenacao].push(row.equipe);
    }
  }
  for (const coord of Object.keys(equipesByCoord)) {
    equipesByCoord[coord].sort();
  }
  return Response.json({
    coordenacoes,
    equipes_by_coordenacao: equipesByCoord
  });
}
__name(handlePlanejamentoFilters, "handlePlanejamentoFilters");
async function handlePlanejamentoTechnicians(request, env) {
  assertJwtSecret(env);
  const auth = await requireAuth(request, env);
  if (!auth) {
    return Response.json({ error: "Token invalido." }, { status: 401 });
  }
  const url = new URL(request.url);
  const coordenacao = (url.searchParams.get("coordenacao") || "").trim();
  const equipe = (url.searchParams.get("equipe") || "").trim();
  if (!coordenacao || !equipe) {
    return Response.json({ technicians: [] });
  }
  const result = await env.DB.prepare(
    `SELECT id, nome, TRIM(coordenacao) AS coordenacao, TRIM(equipe) AS equipe
     FROM tb_user
     WHERE company_id = ?
       AND status = 'ativo'
       AND TRIM(coordenacao) = ?
       AND TRIM(equipe) = ?
     ORDER BY nome`
  ).bind(auth.company_id, coordenacao, equipe).all();
  return Response.json({
    technicians: result.results
  });
}
__name(handlePlanejamentoTechnicians, "handlePlanejamentoTechnicians");
async function handlePlanejamentoAssets(request, env) {
  assertJwtSecret(env);
  const auth = await requireAuth(request, env);
  if (!auth) {
    return Response.json({ error: "Token invalido." }, { status: 401 });
  }
  const url = new URL(request.url);
  const coordenacao = (url.searchParams.get("coordenacao") || "").trim();
  const equipe = (url.searchParams.get("equipe") || "").trim();
  const yearMonth = (url.searchParams.get("year_month") || "").trim();
  if (!coordenacao || !equipe || !yearMonth || !/^[0-9]{4}-[0-9]{2}$/.test(yearMonth)) {
    return Response.json({ ativos: [] });
  }
  const result = await env.DB.prepare(
    `SELECT id,
            ATIVO_CODPE,
            ATIVO_DESCRITIVO_OS,
            ATIVO_SIGLA,
            ATIVO_CICLO,
            ATIVO_ULTIMA_MANUT,
            date(ATIVO_ULTIMA_MANUT, '+' || ATIVO_CONTADOR || ' month') AS proxima_manut
     FROM tb_ativo
     WHERE company_id = ?
       AND ATIVO_STATUS = 'ativo'
       AND TRIM(ATIVO_COORDENACAO) = ?
       AND TRIM(ATIVO_EQUIPE) = ?
       AND ATIVO_ULTIMA_MANUT IS NOT NULL
       AND TRIM(ATIVO_ULTIMA_MANUT) != ''
       AND ATIVO_CONTADOR > 0
       AND strftime('%Y-%m', date(ATIVO_ULTIMA_MANUT, '+' || ATIVO_CONTADOR || ' month')) = ?
     ORDER BY ATIVO_DESCRITIVO_OS`
  ).bind(auth.company_id, coordenacao, equipe, yearMonth).all();
  return Response.json({
    ativos: result.results.map((row) => ({
      id: row.id,
      codpe: row.ATIVO_CODPE,
      description: row.ATIVO_DESCRITIVO_OS,
      sigla: row.ATIVO_SIGLA,
      cycle: row.ATIVO_CICLO,
      lastMaintenance: row.ATIVO_ULTIMA_MANUT || null,
      dueDate: row.proxima_manut || null
    }))
  });
}
__name(handlePlanejamentoAssets, "handlePlanejamentoAssets");
async function handleUpdateUser(request, env) {
  assertJwtSecret(env);
  const auth = await requireAuth(request, env);
  if (!auth) {
    return Response.json({ error: "Token invalido." }, { status: 401 });
  }
  const payload = await readJson(request);
  if (!payload) {
    return Response.json({ error: "Dados invalidos." }, { status: 400 });
  }
  const id = String(payload.id || "").trim();
  if (!id) {
    return Response.json({ error: "ID obrigatorio." }, { status: 400 });
  }
  const nome = payload.nome ? String(payload.nome).trim() : null;
  const cs = payload.cs ? String(payload.cs).trim() : null;
  const email = payload.email ? String(payload.email).trim().toLowerCase() : null;
  const escala = payload.escala ? normalizeEscala(String(payload.escala)) : null;
  const profileId = payload.profile_id ? String(payload.profile_id).trim() : null;
  const cargo = payload.cargo ? String(payload.cargo).trim() : null;
  const coordenacao = payload.coordenacao ? String(payload.coordenacao).trim() : null;
  const equipe = payload.equipe ? String(payload.equipe).trim() : null;
  const equipeAditiva = payload.equipe_aditiva ? String(payload.equipe_aditiva).trim() : null;
  const status = payload.status ? normalizeStatus(String(payload.status)) : null;
  const senha = payload.senha ? String(payload.senha) : null;
  if (cs && !isValidCs(cs)) {
    return Response.json({ error: "CS deve conter 6 digitos." }, { status: 400 });
  }
  if (email && !isValidEmail(email)) {
    return Response.json({ error: "Email invalido." }, { status: 400 });
  }
  if (payload.status && !status) {
    return Response.json({ error: "Status invalido." }, { status: 400 });
  }
  if (payload.escala && !escala) {
    return Response.json({ error: "Escala invalida." }, { status: 400 });
  }
  if (profileId) {
    const profile = await env.DB.prepare(
      "SELECT id, status FROM tb_profile WHERE id = ? AND company_id = ?"
    ).bind(profileId, auth.company_id).first();
    if (!profile || profile.status !== "ativo") {
      return Response.json({ error: "Perfil invalido." }, { status: 400 });
    }
  }
  if (senha && !isPasswordValid(senha)) {
    return Response.json(
      {
        error: "Senha invalida. Minimo 7 caracteres, 1 letra, 1 numero e 1 especial (!@#$%&)."
      },
      { status: 400 }
    );
  }
  const existing = await env.DB.prepare(
    `SELECT id, nome, cs, email, escala, profile_id, cargo, coordenacao, equipe, equipe_aditiva, status
     FROM tb_user WHERE id = ? AND company_id = ?`
  ).bind(id, auth.company_id).first();
  if (!existing) {
    return Response.json({ error: "Usuario nao encontrado." }, { status: 404 });
  }
  const isDelete = status === "excluido" && existing.status !== "excluido";
  const permissionError = await requirePermission(
    env,
    auth,
    "configuracao",
    isDelete ? "exclusao" : "edicao"
  );
  if (permissionError) return permissionError;
  if (cs || email || nome) {
    const conflict = await env.DB.prepare(
      "SELECT id FROM tb_user WHERE company_id = ? AND id != ? AND (cs = ? OR email = ? OR nome = ?)"
    ).bind(auth.company_id, id, cs ?? "", email ?? "", nome ?? "").first();
    if (conflict) {
      return Response.json({ error: "Usuario ja existe." }, { status: 409 });
    }
  }
  const updates = [];
  const values = [];
  const changeLabels = [];
  if (nome !== null && nome !== existing.nome) {
    updates.push("nome = ?");
    values.push(nome);
    changeLabels.push("nome");
  }
  if (cs !== null && cs !== existing.cs) {
    updates.push("cs = ?");
    values.push(cs);
    changeLabels.push("cs");
  }
  if (email !== null && email !== existing.email) {
    updates.push("email = ?");
    values.push(email);
    changeLabels.push("email");
  }
  if (escala !== null && escala !== existing.escala) {
    updates.push("escala = ?");
    values.push(escala);
    changeLabels.push("escala");
  }
  if (profileId !== null && profileId !== existing.profile_id) {
    updates.push("profile_id = ?");
    values.push(profileId);
    changeLabels.push("perfil");
  }
  if (cargo !== null && cargo !== existing.cargo) {
    updates.push("cargo = ?");
    values.push(cargo);
    changeLabels.push("cargo");
  }
  if (coordenacao !== null && coordenacao !== existing.coordenacao) {
    updates.push("coordenacao = ?");
    values.push(coordenacao);
    changeLabels.push("coordenacao");
  }
  if (equipe !== null && equipe !== existing.equipe) {
    updates.push("equipe = ?");
    values.push(equipe);
    changeLabels.push("equipe");
  }
  if (equipeAditiva !== null && equipeAditiva !== existing.equipe_aditiva) {
    updates.push("equipe_aditiva = ?");
    values.push(equipeAditiva);
    changeLabels.push("equipe_aditiva");
  }
  if (status !== null && status !== existing.status) {
    updates.push("status = ?");
    values.push(status);
    changeLabels.push("status");
  }
  if (!updates.length && !senha) {
    return Response.json({ error: "Nada para atualizar." }, { status: 400 });
  }
  if (updates.length) {
    updates.push("updated_at = datetime('now')");
    await env.DB.prepare(
      `UPDATE tb_user SET ${updates.join(", ")} WHERE id = ? AND company_id = ?`
    ).bind(...values, id, auth.company_id).run();
  }
  if (senha) {
    const passwordHash = await import_bcryptjs.default.hash(senha, 10);
    await env.DB.prepare(
      "UPDATE tb_user_auth SET password_hash = ?, failed_attempts = 0, locked_until = NULL WHERE user_id = ?"
    ).bind(passwordHash, id).run();
    changeLabels.push("senha");
  }
  if (changeLabels.length) {
    const changeText = `Alterado: ${changeLabels.join(", ")}`;
    await logUserHistory(env, {
      companyId: auth.company_id,
      userId: id,
      changedByUserId: auth.user_id,
      changedByName: auth.nome,
      changes: changeText
    });
  }
  const user = await env.DB.prepare(
    `SELECT u.id, u.company_id, u.nome, u.cs, u.email, u.escala, u.profile_id,
            p.name AS profile_name, u.cargo, u.coordenacao, u.equipe, u.equipe_aditiva,
            u.status, u.created_at, u.updated_at
     FROM tb_user u
     LEFT JOIN tb_profile p ON p.id = u.profile_id
     WHERE u.id = ? AND u.company_id = ?`
  ).bind(id, auth.company_id).first();
  return Response.json({ user });
}
__name(handleUpdateUser, "handleUpdateUser");
async function handleUserHistory(request, env) {
  assertJwtSecret(env);
  const auth = await requireAuth(request, env);
  if (!auth) {
    return Response.json({ error: "Token invalido." }, { status: 401 });
  }
  const permissionError = await requirePermission(
    env,
    auth,
    "configuracao",
    "leitura"
  );
  if (permissionError) return permissionError;
  const url = new URL(request.url);
  const userId = url.searchParams.get("user_id");
  if (!userId) {
    return Response.json({ error: "user_id obrigatorio." }, { status: 400 });
  }
  const result = await env.DB.prepare(
    `SELECT id, company_id, user_id, changed_by_user_id, changed_by_name, changes, created_at
     FROM tb_user_history
     WHERE company_id = ? AND user_id = ?
     ORDER BY created_at DESC`
  ).bind(auth.company_id, userId).all();
  return Response.json({ history: result.results });
}
__name(handleUserHistory, "handleUserHistory");
async function handleListProfiles(request, env) {
  assertJwtSecret(env);
  const auth = await requireAuth(request, env);
  if (!auth) {
    return Response.json({ error: "Token invalido." }, { status: 401 });
  }
  const permissionError = await requirePermission(
    env,
    auth,
    "configuracao",
    "leitura"
  );
  if (permissionError) return permissionError;
  const profiles = await env.DB.prepare(
    `SELECT id, company_id, name, status, created_at, updated_at
     FROM tb_profile
     WHERE company_id = ?
     ORDER BY created_at DESC`
  ).bind(auth.company_id).all();
  const results = [];
  for (const profile of profiles.results) {
    const permissions = await env.DB.prepare(
      `SELECT profile_id, screen_id, leitura, criacao, edicao, exclusao
       FROM tb_profile_permission
       WHERE profile_id = ?`
    ).bind(profile.id).all();
    results.push({
      ...profile,
      permissions: permissions.results
    });
  }
  return Response.json({ profiles: results });
}
__name(handleListProfiles, "handleListProfiles");
async function handleCreateProfile(request, env) {
  assertJwtSecret(env);
  const auth = await requireAuth(request, env);
  if (!auth) {
    return Response.json({ error: "Token invalido." }, { status: 401 });
  }
  const permissionError = await requirePermission(
    env,
    auth,
    "configuracao",
    "criacao"
  );
  if (permissionError) return permissionError;
  const payload = await readJson(request);
  if (!payload) {
    return Response.json({ error: "Dados invalidos." }, { status: 400 });
  }
  const name = String(payload.name || "").trim();
  const status = normalizeProfileStatus(String(payload.status || "ativo"));
  const permissions = Array.isArray(payload.permissions) ? payload.permissions : [];
  if (!name || !status) {
    return Response.json({ error: "Nome e status sao obrigatorios." }, { status: 400 });
  }
  const conflict = await env.DB.prepare(
    "SELECT id FROM tb_profile WHERE company_id = ? AND name = ?"
  ).bind(auth.company_id, name).first();
  if (conflict) {
    return Response.json({ error: "Perfil ja existe." }, { status: 409 });
  }
  const profileId = crypto.randomUUID();
  await env.DB.prepare(
    `INSERT INTO tb_profile (id, company_id, name, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))`
  ).bind(profileId, auth.company_id, name, status).run();
  await insertProfilePermissions(env, profileId, permissions);
  await logProfileHistory(env, {
    companyId: auth.company_id,
    profileId,
    changedByUserId: auth.user_id,
    changedByName: auth.nome,
    changes: "Perfil criado"
  });
  const profile = await env.DB.prepare(
    `SELECT id, company_id, name, status, created_at, updated_at
     FROM tb_profile WHERE id = ? AND company_id = ?`
  ).bind(profileId, auth.company_id).first();
  const savedPermissions = await env.DB.prepare(
    `SELECT profile_id, screen_id, leitura, criacao, edicao, exclusao
     FROM tb_profile_permission WHERE profile_id = ?`
  ).bind(profileId).all();
  return Response.json(
    { profile: { ...profile, permissions: savedPermissions.results } },
    { status: 201 }
  );
}
__name(handleCreateProfile, "handleCreateProfile");
async function handleUpdateProfile(request, env) {
  assertJwtSecret(env);
  const auth = await requireAuth(request, env);
  if (!auth) {
    return Response.json({ error: "Token invalido." }, { status: 401 });
  }
  const permissionError = await requirePermission(
    env,
    auth,
    "configuracao",
    "edicao"
  );
  if (permissionError) return permissionError;
  const payload = await readJson(request);
  if (!payload) {
    return Response.json({ error: "Dados invalidos." }, { status: 400 });
  }
  const id = String(payload.id || "").trim();
  if (!id) {
    return Response.json({ error: "ID obrigatorio." }, { status: 400 });
  }
  const name = payload.name ? String(payload.name).trim() : null;
  const status = payload.status ? normalizeProfileStatus(String(payload.status)) : null;
  const permissions = Array.isArray(payload.permissions) ? payload.permissions : null;
  if (payload.status && !status) {
    return Response.json({ error: "Status invalido." }, { status: 400 });
  }
  const existing = await env.DB.prepare(
    `SELECT id, name, status
     FROM tb_profile WHERE id = ? AND company_id = ?`
  ).bind(id, auth.company_id).first();
  if (!existing) {
    return Response.json({ error: "Perfil nao encontrado." }, { status: 404 });
  }
  if (name && name !== existing.name) {
    const conflict = await env.DB.prepare(
      "SELECT id FROM tb_profile WHERE company_id = ? AND id != ? AND name = ?"
    ).bind(auth.company_id, id, name).first();
    if (conflict) {
      return Response.json({ error: "Perfil ja existe." }, { status: 409 });
    }
  }
  const updates = [];
  const values = [];
  const changeLabels = [];
  if (name && name !== existing.name) {
    updates.push("name = ?");
    values.push(name);
    changeLabels.push("nome");
  }
  if (status && status !== existing.status) {
    updates.push("status = ?");
    values.push(status);
    changeLabels.push("status");
  }
  if (!updates.length && !permissions) {
    return Response.json({ error: "Nada para atualizar." }, { status: 400 });
  }
  if (updates.length) {
    updates.push("updated_at = datetime('now')");
    await env.DB.prepare(
      `UPDATE tb_profile SET ${updates.join(", ")} WHERE id = ? AND company_id = ?`
    ).bind(...values, id, auth.company_id).run();
  }
  if (permissions) {
    await env.DB.prepare("DELETE FROM tb_profile_permission WHERE profile_id = ?").bind(id).run();
    await insertProfilePermissions(env, id, permissions);
    changeLabels.push("permissoes");
  }
  if (changeLabels.length) {
    await logProfileHistory(env, {
      companyId: auth.company_id,
      profileId: id,
      changedByUserId: auth.user_id,
      changedByName: auth.nome,
      changes: `Alterado: ${changeLabels.join(", ")}`
    });
  }
  const profile = await env.DB.prepare(
    `SELECT id, company_id, name, status, created_at, updated_at
     FROM tb_profile WHERE id = ? AND company_id = ?`
  ).bind(id, auth.company_id).first();
  const savedPermissions = await env.DB.prepare(
    `SELECT profile_id, screen_id, leitura, criacao, edicao, exclusao
     FROM tb_profile_permission WHERE profile_id = ?`
  ).bind(id).all();
  return Response.json({ profile: { ...profile, permissions: savedPermissions.results } });
}
__name(handleUpdateProfile, "handleUpdateProfile");
async function handleProfileHistory(request, env) {
  assertJwtSecret(env);
  const auth = await requireAuth(request, env);
  if (!auth) {
    return Response.json({ error: "Token invalido." }, { status: 401 });
  }
  const permissionError = await requirePermission(
    env,
    auth,
    "configuracao",
    "leitura"
  );
  if (permissionError) return permissionError;
  const url = new URL(request.url);
  const profileId = url.searchParams.get("profile_id");
  if (!profileId) {
    return Response.json({ error: "profile_id obrigatorio." }, { status: 400 });
  }
  const result = await env.DB.prepare(
    `SELECT id, company_id, profile_id, changed_by_user_id, changed_by_name, changes, created_at
     FROM tb_profile_history
     WHERE company_id = ? AND profile_id = ?
     ORDER BY created_at DESC`
  ).bind(auth.company_id, profileId).all();
  return Response.json({ history: result.results });
}
__name(handleProfileHistory, "handleProfileHistory");
async function handleListEstrutura(request, env) {
  assertJwtSecret(env);
  const auth = await requireAuth(request, env);
  if (!auth) {
    return Response.json({ error: "Token invalido." }, { status: 401 });
  }
  const permissionError = await requirePermission(
    env,
    auth,
    "configuracao",
    "leitura"
  );
  if (permissionError) return permissionError;
  const result = await env.DB.prepare(
    `SELECT id, company_id, coordenacao, equipe, cc, execucao, status, created_at
     FROM tb_estrutura
     WHERE company_id = ? AND status != 'excluido'
     ORDER BY created_at DESC`
  ).bind(auth.company_id).all();
  return Response.json({ estrutura: result.results });
}
__name(handleListEstrutura, "handleListEstrutura");
async function handleCreateEstrutura(request, env) {
  assertJwtSecret(env);
  const auth = await requireAuth(request, env);
  if (!auth) {
    return Response.json({ error: "Token invalido." }, { status: 401 });
  }
  const permissionError = await requirePermission(
    env,
    auth,
    "configuracao",
    "criacao"
  );
  if (permissionError) return permissionError;
  const payload = await readJson(request);
  if (!payload) {
    return Response.json({ error: "Dados invalidos." }, { status: 400 });
  }
  const coordenacao = String(payload.coordenacao || "").trim();
  const equipe = String(payload.equipe || "").trim();
  const cc = String(payload.cc || "").trim();
  const execucao = String(payload.execucao || "sim").trim().toLowerCase();
  if (!coordenacao || !equipe || !cc) {
    return Response.json(
      { error: "Coordenacao, equipe e CC sao obrigatorios." },
      { status: 400 }
    );
  }
  if (execucao !== "sim" && execucao !== "nao") {
    return Response.json({ error: "Execucao invalida." }, { status: 400 });
  }
  if (coordenacao.length > 20) {
    return Response.json(
      { error: "Coordenacao deve ter no maximo 20 caracteres." },
      { status: 400 }
    );
  }
  if (equipe.length > 10) {
    return Response.json(
      { error: "Equipe deve ter no maximo 10 caracteres." },
      { status: 400 }
    );
  }
  if (cc.length > 10) {
    return Response.json(
      { error: "CC deve ter no maximo 10 caracteres." },
      { status: 400 }
    );
  }
  const company = await env.DB.prepare(
    "SELECT id, status FROM tb_company WHERE id = ?"
  ).bind(auth.company_id).first();
  if (!company || company.status !== "ativo") {
    return Response.json({ error: "Empresa invalida." }, { status: 400 });
  }
  const conflict = await env.DB.prepare(
    "SELECT id FROM tb_estrutura WHERE company_id = ? AND coordenacao = ? AND equipe = ?"
  ).bind(auth.company_id, coordenacao, equipe).first();
  if (conflict) {
    return Response.json({ error: "Estrutura ja existe." }, { status: 409 });
  }
  const estruturaId = crypto.randomUUID();
  await env.DB.prepare(
    `INSERT INTO tb_estrutura (id, company_id, coordenacao, equipe, cc, execucao, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, 'ativo', datetime('now'))`
  ).bind(estruturaId, auth.company_id, coordenacao, equipe, cc, execucao).run();
  const estrutura = await env.DB.prepare(
    `SELECT id, company_id, coordenacao, equipe, cc, execucao, status, created_at
     FROM tb_estrutura
     WHERE id = ? AND company_id = ?`
  ).bind(estruturaId, auth.company_id).first();
  if (estrutura) {
    await logEstruturaHistory(env, {
      companyId: auth.company_id,
      estruturaId: estrutura.id,
      action: "criado",
      beforeData: null,
      afterData: JSON.stringify({
        coordenacao: estrutura.coordenacao,
        equipe: estrutura.equipe,
        cc: estrutura.cc,
        execucao: estrutura.execucao,
        status: estrutura.status
      }),
      changedByUserId: auth.user_id,
      changedByName: auth.nome
    });
  }
  return Response.json({ estrutura }, { status: 201 });
}
__name(handleCreateEstrutura, "handleCreateEstrutura");
async function handleUpdateEstrutura(request, env) {
  assertJwtSecret(env);
  const auth = await requireAuth(request, env);
  if (!auth) {
    return Response.json({ error: "Token invalido." }, { status: 401 });
  }
  const payload = await readJson(request);
  if (!payload) {
    return Response.json({ error: "Dados invalidos." }, { status: 400 });
  }
  const id = String(payload.id || "").trim();
  if (!id) {
    return Response.json({ error: "ID obrigatorio." }, { status: 400 });
  }
  const coordenacao = payload.coordenacao ? String(payload.coordenacao).trim() : null;
  const equipe = payload.equipe ? String(payload.equipe).trim() : null;
  const cc = payload.cc ? String(payload.cc).trim() : null;
  const execucao = payload.execucao ? String(payload.execucao).trim().toLowerCase() : null;
  const status = payload.status ? normalizeStatus(String(payload.status)) : null;
  if (coordenacao && coordenacao.length > 20) {
    return Response.json(
      { error: "Coordenacao deve ter no maximo 20 caracteres." },
      { status: 400 }
    );
  }
  if (equipe && equipe.length > 10) {
    return Response.json(
      { error: "Equipe deve ter no maximo 10 caracteres." },
      { status: 400 }
    );
  }
  if (cc && cc.length > 10) {
    return Response.json(
      { error: "CC deve ter no maximo 10 caracteres." },
      { status: 400 }
    );
  }
  if (payload.execucao && execucao !== "sim" && execucao !== "nao") {
    return Response.json({ error: "Execucao invalida." }, { status: 400 });
  }
  if (payload.status && !status) {
    return Response.json({ error: "Status invalido." }, { status: 400 });
  }
  const existing = await env.DB.prepare(
    `SELECT id, company_id, coordenacao, equipe, cc, execucao, status, created_at
     FROM tb_estrutura WHERE id = ? AND company_id = ?`
  ).bind(id, auth.company_id).first();
  if (!existing) {
    return Response.json({ error: "Estrutura nao encontrada." }, { status: 404 });
  }
  const isDelete = status === "inativo" && existing.status !== "inativo";
  const permissionError = await requirePermission(
    env,
    auth,
    "configuracao",
    isDelete ? "exclusao" : "edicao"
  );
  if (permissionError) return permissionError;
  const nextCoordenacao = coordenacao ?? existing.coordenacao;
  const nextEquipe = equipe ?? existing.equipe;
  const shouldCheckUnique = coordenacao && coordenacao !== existing.coordenacao || equipe && equipe !== existing.equipe;
  if (shouldCheckUnique) {
    const conflict = await env.DB.prepare(
      "SELECT id FROM tb_estrutura WHERE company_id = ? AND coordenacao = ? AND equipe = ? AND id != ?"
    ).bind(auth.company_id, nextCoordenacao, nextEquipe, id).first();
    if (conflict) {
      return Response.json({ error: "Estrutura ja existe." }, { status: 409 });
    }
  }
  const updates = [];
  const values = [];
  if (coordenacao !== null && coordenacao !== existing.coordenacao) {
    updates.push("coordenacao = ?");
    values.push(coordenacao);
  }
  if (equipe !== null && equipe !== existing.equipe) {
    updates.push("equipe = ?");
    values.push(equipe);
  }
  if (cc !== null && cc !== existing.cc) {
    updates.push("cc = ?");
    values.push(cc);
  }
  if (execucao !== null && execucao !== existing.execucao) {
    updates.push("execucao = ?");
    values.push(execucao);
  }
  if (status !== null && status !== existing.status) {
    updates.push("status = ?");
    values.push(status);
  }
  if (!updates.length) {
    if (status === "excluido" && existing.status === "excluido") {
      return Response.json({ estrutura: existing });
    }
    return Response.json({ error: "Nada para atualizar." }, { status: 400 });
  }
  await env.DB.prepare(
    `UPDATE tb_estrutura SET ${updates.join(", ")} WHERE id = ? AND company_id = ?`
  ).bind(...values, id, auth.company_id).run();
  const estrutura = await env.DB.prepare(
    `SELECT id, company_id, coordenacao, equipe, cc, execucao, status, created_at
     FROM tb_estrutura
     WHERE id = ? AND company_id = ?`
  ).bind(id, auth.company_id).first();
  if (estrutura) {
    await logEstruturaHistory(env, {
      companyId: auth.company_id,
      estruturaId: estrutura.id,
      action: "atualizado",
      beforeData: JSON.stringify({
        coordenacao: existing.coordenacao,
        equipe: existing.equipe,
        cc: existing.cc,
        execucao: existing.execucao,
        status: existing.status
      }),
      afterData: JSON.stringify({
        coordenacao: estrutura.coordenacao,
        equipe: estrutura.equipe,
        cc: estrutura.cc,
        execucao: estrutura.execucao,
        status: estrutura.status
      }),
      changedByUserId: auth.user_id,
      changedByName: auth.nome
    });
  }
  return Response.json({ estrutura });
}
__name(handleUpdateEstrutura, "handleUpdateEstrutura");
async function handleEstruturaHistory(request, env) {
  assertJwtSecret(env);
  const auth = await requireAuth(request, env);
  if (!auth) {
    return Response.json({ error: "Token invalido." }, { status: 401 });
  }
  const permissionError = await requirePermission(
    env,
    auth,
    "configuracao",
    "leitura"
  );
  if (permissionError) return permissionError;
  const url = new URL(request.url);
  const estruturaId = url.searchParams.get("estrutura_id");
  if (!estruturaId) {
    return Response.json({ error: "estrutura_id obrigatorio." }, { status: 400 });
  }
  const result = await env.DB.prepare(
    `SELECT id, company_id, estrutura_id, action, before_data, after_data, changed_by_user_id, changed_by_name, created_at
     FROM tb_estrutura_history
     WHERE company_id = ? AND estrutura_id = ?
     ORDER BY created_at DESC`
  ).bind(auth.company_id, estruturaId).all();
  return Response.json({ history: result.results });
}
__name(handleEstruturaHistory, "handleEstruturaHistory");
async function handleListParametros(request, env) {
  assertJwtSecret(env);
  const auth = await requireAuth(request, env);
  if (!auth) {
    return Response.json({ error: "Token invalido." }, { status: 401 });
  }
  const permissionError = await requirePermission(
    env,
    auth,
    "configuracao",
    "leitura"
  );
  if (permissionError) return permissionError;
  await ensureParametrosTable(env);
  const url = new URL(request.url);
  const conditions = ["company_id = ?"];
  const values = [auth.company_id];
  const tipoParam = url.searchParams.get("tipo_parametro");
  if (tipoParam && PARAMETRO_TIPOS.includes(tipoParam)) {
    conditions.push("tipo_parametro = ?");
    values.push(tipoParam);
  }
  const ativoParam = parseBooleanFlag(url.searchParams.get("ativo"));
  if (ativoParam !== null) {
    conditions.push("ativo = ?");
    values.push(ativoParam);
  }
  const result = await env.DB.prepare(
    `SELECT id_parametro, company_id, tipo_parametro, valor, ativo, ordem, observacao, created_at, updated_at
     FROM tb_parametro
     WHERE ${conditions.join(" AND ")}
     ORDER BY tipo_parametro ASC, ordem IS NULL, ordem ASC`
  ).bind(...values).all();
  return Response.json({ parametros: result.results });
}
__name(handleListParametros, "handleListParametros");
async function handleCreateParametro(request, env) {
  assertJwtSecret(env);
  const auth = await requireAuth(request, env);
  if (!auth) {
    return Response.json({ error: "Token invalido." }, { status: 401 });
  }
  const permissionError = await requirePermission(
    env,
    auth,
    "configuracao",
    "criacao"
  );
  if (permissionError) return permissionError;
  await ensureParametrosTable(env);
  const payload = await readJson(request);
  if (!payload) {
    return Response.json({ error: "Dados invalidos." }, { status: 400 });
  }
  const tipoParametro = String(payload.tipo_parametro || "").trim();
  if (!PARAMETRO_TIPOS.includes(tipoParametro)) {
    return Response.json({ error: "Tipo de parametro invalido." }, { status: 400 });
  }
  const valor = String(payload.valor || "").trim();
  if (!valor) {
    return Response.json({ error: "Valor obrigatorio." }, { status: 400 });
  }
  const ativoFlag = parseBooleanFlag(payload.ativo);
  const ativoValue = ativoFlag === null ? 1 : ativoFlag;
  const ordemValue = payload.ordem !== void 0 ? parseNullableNumber(payload.ordem) : null;
  const observacaoValue = payload.observacao !== void 0 ? String(payload.observacao).trim() || null : null;
  const duplicate = await env.DB.prepare(
    `SELECT id_parametro
       FROM tb_parametro
       WHERE company_id = ? AND tipo_parametro = ? AND valor = ?`
  ).bind(auth.company_id, tipoParametro, valor).first();
  if (duplicate) {
    return Response.json({ error: "Parametro ja existe." }, { status: 409 });
  }
  const idParametro = crypto.randomUUID();
  await env.DB.prepare(
    `INSERT INTO tb_parametro (
      id_parametro,
      company_id,
      tipo_parametro,
      valor,
      ativo,
      ordem,
      observacao,
      created_at,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`
  ).bind(
    idParametro,
    auth.company_id,
    tipoParametro,
    valor,
    ativoValue,
    ordemValue,
    observacaoValue
  ).run();
  const inserted = await env.DB.prepare(
    `SELECT id_parametro, company_id, tipo_parametro, valor, ativo, ordem, observacao, created_at, updated_at
       FROM tb_parametro
       WHERE id_parametro = ?`
  ).bind(idParametro).first();
  return Response.json({ parametro: inserted }, { status: 201 });
}
__name(handleCreateParametro, "handleCreateParametro");
async function handleUpdateParametro(request, env) {
  assertJwtSecret(env);
  const auth = await requireAuth(request, env);
  if (!auth) {
    return Response.json({ error: "Token invalido." }, { status: 401 });
  }
  const permissionError = await requirePermission(
    env,
    auth,
    "configuracao",
    "edicao"
  );
  if (permissionError) return permissionError;
  await ensureParametrosTable(env);
  const payload = await readJson(request);
  if (!payload) {
    return Response.json({ error: "Dados invalidos." }, { status: 400 });
  }
  const idParametro = String(payload.id_parametro || "").trim();
  if (!idParametro) {
    return Response.json({ error: "id_parametro obrigatorio." }, { status: 400 });
  }
  const existing = await env.DB.prepare(
    `SELECT id_parametro
       FROM tb_parametro
       WHERE id_parametro = ? AND company_id = ?`
  ).bind(idParametro, auth.company_id).first();
  if (!existing) {
    return Response.json({ error: "Parametro nao encontrado." }, { status: 404 });
  }
  const updates = [];
  const values = [];
  if (payload.valor !== void 0) {
    const valor = String(payload.valor || "").trim();
    if (!valor) {
      return Response.json({ error: "Valor obrigatorio." }, { status: 400 });
    }
    updates.push("valor = ?");
    values.push(valor);
  }
  const ativoParam = payload.ativo === void 0 ? null : parseBooleanFlag(payload.ativo);
  if (ativoParam !== null) {
    updates.push("ativo = ?");
    values.push(ativoParam);
  }
  if (payload.ordem !== void 0) {
    updates.push("ordem = ?");
    values.push(parseNullableNumber(payload.ordem));
  }
  if (payload.observacao !== void 0) {
    const observacao = String(payload.observacao).trim();
    updates.push("observacao = ?");
    values.push(observacao || null);
  }
  if (!updates.length) {
    return Response.json({ error: "Nada para atualizar." }, { status: 400 });
  }
  updates.push("updated_at = datetime('now')");
  const query = `UPDATE tb_parametro SET ${updates.join(", ")} WHERE id_parametro = ?`;
  values.push(idParametro);
  await env.DB.prepare(query).bind(...values).run();
  const updated = await env.DB.prepare(
    `SELECT id_parametro, company_id, tipo_parametro, valor, ativo, ordem, observacao, created_at, updated_at
       FROM tb_parametro
       WHERE id_parametro = ?`
  ).bind(idParametro).first();
  return Response.json({ parametro: updated });
}
__name(handleUpdateParametro, "handleUpdateParametro");
async function handleListAtivos(request, env) {
  assertJwtSecret(env);
  const auth = await requireAuth(request, env);
  if (!auth) {
    return Response.json({ error: "Token invalido." }, { status: 401 });
  }
  const url = new URL(request.url);
  const conditions = ["company_id = ?"];
  const values = [auth.company_id];
  const applyFilter = /* @__PURE__ */ __name((param, column) => {
    if (!param) return;
    conditions.push(`${column} LIKE ?`);
    values.push(`%${param.trim()}%`);
  }, "applyFilter");
  applyFilter(url.searchParams.get("codpe"), "ATIVO_CODPE");
  applyFilter(url.searchParams.get("descritivo"), "ATIVO_DESCRITIVO_OS");
  applyFilter(url.searchParams.get("equipe"), "ATIVO_EQUIPE");
  applyFilter(url.searchParams.get("ciclo"), "ATIVO_CICLO");
  applyFilter(url.searchParams.get("sigla"), "ATIVO_SIGLA");
  applyFilter(url.searchParams.get("monitorados"), "ATIVO_MONITORADOS");
  applyFilter(url.searchParams.get("ultima_manut"), "ATIVO_ULTIMA_MANUT");
  const result = await env.DB.prepare(
    `SELECT id,
            ATIVO_CODPE,
            ATIVO_DESCRITIVO_OS,
            ATIVO_COORDENACAO,
            ATIVO_EQUIPE,
            ATIVO_CICLO,
            ATIVO_SIGLA,
            ATIVO_MONITORADOS,
            ATIVO_ULTIMA_MANUT,
            ATIVO_STATUS
     FROM tb_ativo
     WHERE ${conditions.join(" AND ")}
     ORDER BY ATIVO_CODPE ASC`
  ).bind(...values).all();
  return Response.json({ ativos: result.results });
}
__name(handleListAtivos, "handleListAtivos");
async function handleListComponentes(request, env) {
  assertJwtSecret(env);
  const auth = await requireAuth(request, env);
  if (!auth) {
    return Response.json({ error: "Token invalido." }, { status: 401 });
  }
  const permissionError = await requirePermission(
    env,
    auth,
    "componentes",
    "leitura"
  );
  if (permissionError) return permissionError;
  const url = new URL(request.url);
  const conditions = ["c.company_id = ?"];
  const values = [auth.company_id];
  const applyFilter = /* @__PURE__ */ __name((param, column) => {
    if (!param) return;
    conditions.push(`${column} LIKE ?`);
    values.push(`%${param.trim()}%`);
  }, "applyFilter");
  applyFilter(url.searchParams.get("codpe"), "a.ATIVO_CODPE");
  applyFilter(url.searchParams.get("descritivo"), "a.ATIVO_DESCRITIVO_OS");
  applyFilter(url.searchParams.get("nome"), "c.COMP_NOME");
  applyFilter(url.searchParams.get("modelo"), "c.COMP_MODELO");
  applyFilter(url.searchParams.get("serial"), "c.COMP_SERIAL");
  const result = await env.DB.prepare(
    `SELECT c.IDCOMPONETE,
            c.company_id,
            c.IDATIVO,
            c.COMP_NOME,
            c.COMP_SERIAL,
            c.COMP_DATA,
            c.COMP_MODELO,
            c.COMP_DESCRICAO,
            a.ATIVO_CODPE,
            a.ATIVO_DESCRITIVO_OS,
            a.ATIVO_SIGLA,
            a.ATIVO_COORDENACAO,
            a.ATIVO_EQUIPE
     FROM tb_componente c
     LEFT JOIN tb_ativo a ON a.id = c.IDATIVO AND a.company_id = c.company_id
     WHERE ${conditions.join(" AND ")}
     ORDER BY c.IDCOMPONETE DESC`
  ).bind(...values).all();
  return Response.json({ componentes: result.results });
}
__name(handleListComponentes, "handleListComponentes");
async function handleGetComponenteDetail(request, env) {
  assertJwtSecret(env);
  const auth = await requireAuth(request, env);
  if (!auth) {
    return Response.json({ error: "Token invalido." }, { status: 401 });
  }
  const permissionError = await requirePermission(
    env,
    auth,
    "componentes",
    "leitura"
  );
  if (permissionError) return permissionError;
  const url = new URL(request.url);
  const idParam = url.searchParams.get("id");
  if (!idParam) {
    return Response.json(
      { error: "component_id obrigatorio." },
      { status: 400 }
    );
  }
  const componentId = Number(idParam);
  if (!Number.isFinite(componentId)) {
    return Response.json({ error: "ID invalido." }, { status: 400 });
  }
  const componente = await fetchComponenteWithAsset(
    env,
    auth.company_id,
    componentId
  );
  if (!componente) {
    return Response.json({ error: "Componente nao encontrado." }, { status: 404 });
  }
  return Response.json({ componente });
}
__name(handleGetComponenteDetail, "handleGetComponenteDetail");
async function handleCreateComponente(request, env) {
  assertJwtSecret(env);
  const auth = await requireAuth(request, env);
  if (!auth) {
    return Response.json({ error: "Token invalido." }, { status: 401 });
  }
  const permissionError = await requirePermission(
    env,
    auth,
    "componentes",
    "criacao"
  );
  if (permissionError) return permissionError;
  const payload = await readJson(request);
  if (!payload) {
    return Response.json({ error: "Dados invalidos." }, { status: 400 });
  }
  const idAtivo = String(payload.IDATIVO ?? "").trim();
  const nome = String(payload.COMP_NOME ?? "").trim();
  const modelo = String(payload.COMP_MODELO ?? "").trim();
  const serial = payload.COMP_SERIAL !== void 0 && payload.COMP_SERIAL !== null ? String(payload.COMP_SERIAL).trim() : null;
  const data = payload.COMP_DATA !== void 0 && payload.COMP_DATA !== null ? String(payload.COMP_DATA).trim() : null;
  const descricao = payload.COMP_DESCRICAO !== void 0 && payload.COMP_DESCRICAO !== null ? String(payload.COMP_DESCRICAO).trim() : null;
  if (!idAtivo || !nome || !modelo) {
    return Response.json(
      { error: "IDATIVO, COMP_NOME e COMP_MODELO sao obrigatorios." },
      { status: 400 }
    );
  }
  const ativo = await env.DB.prepare(
    "SELECT id FROM tb_ativo WHERE company_id = ? AND (id = ? OR ATIVO_CODPE = ?)"
  ).bind(auth.company_id, idAtivo, idAtivo).first();
  if (!ativo) {
    return Response.json({ error: "Ativo invalido." }, { status: 400 });
  }
  const insert = await env.DB.prepare(
    `INSERT INTO tb_componente (company_id, IDATIVO, COMP_NOME, COMP_SERIAL, COMP_DATA, COMP_MODELO, COMP_DESCRICAO)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    auth.company_id,
    ativo.id,
    nome,
    serial || null,
    data || null,
    modelo,
    descricao || null
  ).run();
  const componentId = Number(insert.meta.last_insert_rowid ?? 0);
  if (!componentId) {
    return Response.json(
      { error: "Nao foi possivel criar o componente." },
      { status: 500 }
    );
  }
  const componente = await fetchComponenteWithAsset(
    env,
    auth.company_id,
    componentId
  );
  if (!componente) {
    return Response.json(
      { error: "Componente criado, mas nao foi possivel recuperar os dados." },
      { status: 500 }
    );
  }
  return Response.json({ componente });
}
__name(handleCreateComponente, "handleCreateComponente");
async function handleUpdateComponente(request, env) {
  assertJwtSecret(env);
  const auth = await requireAuth(request, env);
  if (!auth) {
    return Response.json({ error: "Token invalido." }, { status: 401 });
  }
  const permissionError = await requirePermission(
    env,
    auth,
    "componentes",
    "edicao"
  );
  if (permissionError) return permissionError;
  const payload = await readJson(request);
  if (!payload) {
    return Response.json({ error: "Dados invalidos." }, { status: 400 });
  }
  const componentId = Number(payload.IDCOMPONETE ?? "");
  if (!Number.isFinite(componentId)) {
    return Response.json({ error: "IDCOMPONETE obrigatorio." }, { status: 400 });
  }
  const existing = await env.DB.prepare(
    `SELECT IDCOMPONETE,
              company_id,
              IDATIVO,
              COMP_NOME,
              COMP_SERIAL,
              COMP_DATA,
              COMP_MODELO,
              COMP_DESCRICAO
       FROM tb_componente
       WHERE IDCOMPONETE = ? AND company_id = ?`
  ).bind(componentId, auth.company_id).first();
  if (!existing) {
    return Response.json({ error: "Componente nao encontrado." }, { status: 404 });
  }
  const nome = String(payload.COMP_NOME ?? existing.COMP_NOME ?? "").trim();
  const modelo = String(payload.COMP_MODELO ?? existing.COMP_MODELO ?? "").trim();
  if (!nome || !modelo) {
    return Response.json(
      { error: "COMP_NOME e COMP_MODELO sao obrigatorios." },
      { status: 400 }
    );
  }
  const serial = payload.COMP_SERIAL !== void 0 ? payload.COMP_SERIAL === null ? null : String(payload.COMP_SERIAL).trim() : existing.COMP_SERIAL;
  const data = payload.COMP_DATA !== void 0 ? payload.COMP_DATA === null ? null : String(payload.COMP_DATA).trim() : existing.COMP_DATA;
  const descricao = payload.COMP_DESCRICAO !== void 0 ? payload.COMP_DESCRICAO === null ? null : String(payload.COMP_DESCRICAO).trim() : existing.COMP_DESCRICAO;
  const ativoInput = String(payload.IDATIVO ?? existing.IDATIVO ?? "").trim();
  if (!ativoInput) {
    return Response.json({ error: "IDATIVO obrigatorio." }, { status: 400 });
  }
  const ativo = await env.DB.prepare(
    `SELECT id
       FROM tb_ativo
       WHERE company_id = ? AND (id = ? OR ATIVO_CODPE = ?)`
  ).bind(auth.company_id, ativoInput, ativoInput).first();
  if (!ativo) {
    return Response.json({ error: "Ativo invalido." }, { status: 400 });
  }
  const updates = [
    "IDATIVO = ?",
    "COMP_NOME = ?",
    "COMP_SERIAL = ?",
    "COMP_DATA = ?",
    "COMP_MODELO = ?",
    "COMP_DESCRICAO = ?"
  ];
  const values = [
    ativo.id,
    nome,
    serial || null,
    data || null,
    modelo,
    descricao || null,
    componentId,
    auth.company_id
  ];
  const changedFields = [];
  const diff = /* @__PURE__ */ __name((label, beforeValue, afterValue) => {
    const before = beforeValue ?? "";
    const after = afterValue ?? "";
    if (before !== after) {
      changedFields.push({ label, before, after });
    }
  }, "diff");
  diff("Componente", existing.COMP_NOME, nome);
  diff("Modelo", existing.COMP_MODELO, modelo);
  diff("Serial", existing.COMP_SERIAL, serial);
  diff("Instala\xE7\xE3o", existing.COMP_DATA, data);
  diff("Descri\xE7\xE3o", existing.COMP_DESCRICAO, descricao);
  if (!changedFields.length) {
    return Response.json(
      { error: "Nenhuma altera\xE7\xE3o detectada." },
      { status: 400 }
    );
  }
  await env.DB.prepare(
    `UPDATE tb_componente
       SET ${updates.join(", ")}
       WHERE IDCOMPONETE = ? AND company_id = ?`
  ).bind(...values).run();
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const resumo = changedFields.map((change) => {
    const beforeValue = change.before || "-";
    const afterValue = change.after || "-";
    return `${change.label}: ${beforeValue} -> ${afterValue}`;
  }).join(" | ");
  await env.DB.prepare(
    `INSERT INTO tb_componente_alteracao (
       company_id,
       IDCOMPONETE,
       usuario_id,
       data_hora,
       campos_alterados
     ) VALUES (?, ?, ?, ?, ?)`
  ).bind(auth.company_id, componentId, auth.user_id, now, resumo).run();
  const componente = await fetchComponenteWithAsset(
    env,
    auth.company_id,
    componentId
  );
  if (!componente) {
    return Response.json(
      { error: "Componente atualizado, mas nao foi possivel recuperar os dados." },
      { status: 500 }
    );
  }
  return Response.json({ componente });
}
__name(handleUpdateComponente, "handleUpdateComponente");
async function handleComponentesMaintenanceHistory(request, env) {
  assertJwtSecret(env);
  const auth = await requireAuth(request, env);
  if (!auth) {
    return Response.json({ error: "Token invalido." }, { status: 401 });
  }
  const permissionError = await requirePermission(
    env,
    auth,
    "componentes",
    "leitura"
  );
  if (permissionError) return permissionError;
  const url = new URL(request.url);
  const componentId = Number(url.searchParams.get("component_id") ?? "");
  if (!Number.isFinite(componentId)) {
    return Response.json({ error: "component_id obrigatorio." }, { status: 400 });
  }
  const result = await env.DB.prepare(
    `SELECT id, company_id, hist_manut_id_componente, hist_manut_data_hora, hist_manut_id_os, created_at
     FROM tb_componente_manutencao
     WHERE company_id = ? AND hist_manut_id_componente = ?
     ORDER BY hist_manut_data_hora DESC`
  ).bind(auth.company_id, componentId).all();
  return Response.json({ history: result.results });
}
__name(handleComponentesMaintenanceHistory, "handleComponentesMaintenanceHistory");
async function handleComponentesChangeHistory(request, env) {
  assertJwtSecret(env);
  const auth = await requireAuth(request, env);
  if (!auth) {
    return Response.json({ error: "Token invalido." }, { status: 401 });
  }
  const permissionError = await requirePermission(
    env,
    auth,
    "componentes",
    "leitura"
  );
  if (permissionError) return permissionError;
  const url = new URL(request.url);
  const componentId = Number(url.searchParams.get("component_id") ?? "");
  if (!Number.isFinite(componentId)) {
    return Response.json({ error: "component_id obrigatorio." }, { status: 400 });
  }
  const result = await env.DB.prepare(
    `SELECT id, company_id, IDCOMPONETE, usuario_id, data_hora, campos_alterados, created_at
     FROM tb_componente_alteracao
     WHERE company_id = ? AND IDCOMPONETE = ?
     ORDER BY data_hora DESC`
  ).bind(auth.company_id, componentId).all();
  return Response.json({ history: result.results });
}
__name(handleComponentesChangeHistory, "handleComponentesChangeHistory");
async function handleListNotas(request, env) {
  assertJwtSecret(env);
  const auth = await requireAuth(request, env);
  if (!auth) {
    return Response.json({ error: "Token invalido." }, { status: 401 });
  }
  const permissionError = await requirePermission(env, auth, "notas", "leitura");
  if (permissionError) return permissionError;
  const url = new URL(request.url);
  const conditions = ["n.company_id = ?"];
  const values = [auth.company_id];
  const search = url.searchParams.get("search");
  if (search) {
    const term = `%${search.trim()}%`;
    conditions.push(
      `(a.ATIVO_CODPE LIKE ? OR a.ATIVO_DESCRITIVO_OS LIKE ? OR n.nota_pendencia LIKE ?)`
    );
    values.push(term, term, term);
  }
  const status = normalizeNotaStatus(url.searchParams.get("status"));
  if (status) {
    conditions.push("n.nota_status = ?");
    values.push(status);
  }
  const result = await env.DB.prepare(
    `SELECT n.IDNOTA,
            n.company_id,
            n.id_ativo,
            n.id_os,
            n.nota_pendencia,
            n.nota_status,
            n.nota_data_criada,
            n.nota_data_programada,
            n.nota_data_realizada,
            n.nota_observacao_pcm,
            n.nota_observacao_tecnico,
            a.ATIVO_CODPE,
            a.ATIVO_DESCRITIVO_OS
     FROM tb_nota n
     LEFT JOIN tb_ativo a ON a.id = n.id_ativo AND a.company_id = n.company_id
     WHERE ${conditions.join(" AND ")}
     ORDER BY n.nota_data_criada DESC`
  ).bind(...values).all();
  return Response.json({ notas: result.results });
}
__name(handleListNotas, "handleListNotas");
async function handleGetNotaDetail(request, env) {
  assertJwtSecret(env);
  const auth = await requireAuth(request, env);
  if (!auth) {
    return Response.json({ error: "Token invalido." }, { status: 401 });
  }
  const permissionError = await requirePermission(env, auth, "notas", "leitura");
  if (permissionError) return permissionError;
  const url = new URL(request.url);
  const idParam = url.searchParams.get("id");
  if (!idParam) {
    return Response.json({ error: "nota_id obrigatorio." }, { status: 400 });
  }
  const notaId = Number(idParam);
  if (!Number.isFinite(notaId)) {
    return Response.json({ error: "ID invalido." }, { status: 400 });
  }
  const nota = await fetchNotaWithAsset(env, auth.company_id, notaId);
  if (!nota) {
    return Response.json({ error: "Nota nao encontrada." }, { status: 404 });
  }
  return Response.json({ nota });
}
__name(handleGetNotaDetail, "handleGetNotaDetail");
async function handleNotaChangeHistory(request, env) {
  assertJwtSecret(env);
  const auth = await requireAuth(request, env);
  if (!auth) {
    return Response.json({ error: "Token invalido." }, { status: 401 });
  }
  const permissionError = await requirePermission(env, auth, "notas", "leitura");
  if (permissionError) return permissionError;
  const url = new URL(request.url);
  const notaId = Number(url.searchParams.get("nota_id") ?? "");
  if (!Number.isFinite(notaId)) {
    return Response.json({ error: "nota_id obrigatorio." }, { status: 400 });
  }
  const result = await env.DB.prepare(
    `SELECT id, company_id, IDNOTA, usuario_id, data_hora, campos_alterados, created_at
     FROM tb_nota_alteracao
     WHERE company_id = ? AND IDNOTA = ?
     ORDER BY data_hora DESC`
  ).bind(auth.company_id, notaId).all();
  return Response.json({ history: result.results });
}
__name(handleNotaChangeHistory, "handleNotaChangeHistory");
async function handleCreateNotas(request, env) {
  assertJwtSecret(env);
  const auth = await requireAuth(request, env);
  if (!auth) {
    return Response.json({ error: "Token invalido." }, { status: 401 });
  }
  const permissionError = await requirePermission(env, auth, "notas", "criacao");
  if (permissionError) return permissionError;
  const payload = await readJson(request);
  if (!payload) {
    return Response.json({ error: "Dados invalidos." }, { status: 400 });
  }
  const ativosInput = Array.isArray(payload.ativos) ? payload.ativos.map((value) => String(value ?? "").trim()) : [];
  if (!ativosInput.length && payload.IDATIVO) {
    ativosInput.push(String(payload.IDATIVO).trim());
  }
  const ativos = ativosInput.filter(Boolean);
  const pendencia = String(payload.nota_pendencia ?? "").trim();
  const status = normalizeNotaStatus(payload.nota_status);
  if (!ativos.length || !pendencia || !status) {
    return Response.json(
      { error: "Ativo, pendencia e status sao obrigatorios." },
      { status: 400 }
    );
  }
  const idOs = payload.id_os !== void 0 && payload.id_os !== null ? String(payload.id_os).trim() : null;
  const descricaoPcm = payload.nota_observacao_pcm !== void 0 && payload.nota_observacao_pcm !== null ? String(payload.nota_observacao_pcm).trim() : null;
  const descricaoTecnico = payload.nota_observacao_tecnico !== void 0 && payload.nota_observacao_tecnico !== null ? String(payload.nota_observacao_tecnico).trim() : null;
  const dataProgramada = payload.nota_data_programada !== void 0 && payload.nota_data_programada !== null ? String(payload.nota_data_programada).trim() : null;
  const dataRealizada = payload.nota_data_realizada !== void 0 && payload.nota_data_realizada !== null ? String(payload.nota_data_realizada).trim() : null;
  const noteStmt = env.DB.prepare(
    `INSERT INTO tb_nota (
       company_id,
       id_ativo,
       id_os,
       nota_pendencia,
       nota_status,
       nota_data_programada,
       nota_data_realizada,
       nota_observacao_pcm,
       nota_observacao_tecnico
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  const created = [];
  for (const ativoCodpe of ativos) {
    if (!ativoCodpe) continue;
    const ativo = await env.DB.prepare(
      `SELECT id FROM tb_ativo WHERE company_id = ? AND (id = ? OR ATIVO_CODPE = ?)`
    ).bind(auth.company_id, ativoCodpe, ativoCodpe).first();
    if (!ativo) {
      return Response.json({ error: `Ativo ${ativoCodpe} invalido.` }, { status: 400 });
    }
    const result = await noteStmt.bind(
      auth.company_id,
      ativo.id,
      idOs || null,
      pendencia,
      status,
      dataProgramada || null,
      dataRealizada || null,
      descricaoPcm || null,
      descricaoTecnico || null
    ).run();
    const notaId = Number(result.meta.last_insert_rowid ?? 0);
    if (!notaId) continue;
    const record = await fetchNotaWithAsset(env, auth.company_id, notaId);
    if (record) {
      created.push(record);
    }
  }
  if (!created.length) {
    return Response.json(
      { error: "Nao foi possivel criar as notas." },
      { status: 500 }
    );
  }
  return Response.json({ notas: created });
}
__name(handleCreateNotas, "handleCreateNotas");
async function handleUpdateNota(request, env) {
  assertJwtSecret(env);
  const auth = await requireAuth(request, env);
  if (!auth) {
    return Response.json({ error: "Token invalido." }, { status: 401 });
  }
  const permissionError = await requirePermission(env, auth, "notas", "edicao");
  if (permissionError) return permissionError;
  const payload = await readJson(request);
  if (!payload) {
    return Response.json({ error: "Dados invalidos." }, { status: 400 });
  }
  const notaId = Number(payload.IDNOTA ?? "");
  if (!Number.isFinite(notaId)) {
    return Response.json({ error: "IDNOTA obrigatorio." }, { status: 400 });
  }
  const existing = await env.DB.prepare(
    `SELECT IDNOTA,
              company_id,
              id_ativo,
              id_os,
              nota_pendencia,
              nota_status,
              nota_data_programada,
              nota_data_realizada,
              nota_observacao_pcm,
              nota_observacao_tecnico
       FROM tb_nota
       WHERE IDNOTA = ? AND company_id = ?`
  ).bind(notaId, auth.company_id).first();
  if (!existing) {
    return Response.json({ error: "Nota nao encontrada." }, { status: 404 });
  }
  const pendencia = String(payload.nota_pendencia ?? existing.nota_pendencia ?? "").trim();
  const status = normalizeNotaStatus(
    payload.nota_status ?? existing.nota_status
  );
  if (!pendencia || !status) {
    return Response.json(
      { error: "Pendencia e status sao obrigatorios." },
      { status: 400 }
    );
  }
  const idOs = payload.id_os !== void 0 ? payload.id_os === null ? null : String(payload.id_os).trim() : existing.id_os;
  const descricaoPcm = payload.nota_observacao_pcm !== void 0 ? payload.nota_observacao_pcm === null ? null : String(payload.nota_observacao_pcm).trim() : existing.nota_observacao_pcm;
  const descricaoTecnico = payload.nota_observacao_tecnico !== void 0 ? payload.nota_observacao_tecnico === null ? null : String(payload.nota_observacao_tecnico).trim() : existing.nota_observacao_tecnico;
  const dataProgramada = payload.nota_data_programada !== void 0 ? payload.nota_data_programada === null ? null : String(payload.nota_data_programada).trim() : existing.nota_data_programada;
  const dataRealizada = payload.nota_data_realizada !== void 0 ? payload.nota_data_realizada === null ? null : String(payload.nota_data_realizada).trim() : existing.nota_data_realizada;
  const ativoInput = String(payload.IDATIVO ?? existing.id_ativo ?? "").trim();
  if (!ativoInput) {
    return Response.json({ error: "IDATIVO obrigatorio." }, { status: 400 });
  }
  const ativo = await env.DB.prepare(
    `SELECT id
       FROM tb_ativo
       WHERE company_id = ? AND (id = ? OR ATIVO_CODPE = ?)`
  ).bind(auth.company_id, ativoInput, ativoInput).first();
  if (!ativo) {
    return Response.json({ error: "Ativo invalido." }, { status: 400 });
  }
  const updates = [
    "id_ativo = ?",
    "id_os = ?",
    "nota_pendencia = ?",
    "nota_status = ?",
    "nota_data_programada = ?",
    "nota_data_realizada = ?",
    "nota_observacao_pcm = ?",
    "nota_observacao_tecnico = ?"
  ];
  const values = [
    ativo.id,
    idOs || null,
    pendencia,
    status,
    dataProgramada || null,
    dataRealizada || null,
    descricaoPcm || null,
    descricaoTecnico || null,
    notaId,
    auth.company_id
  ];
  const changedFields = [];
  const diff = /* @__PURE__ */ __name((label, beforeValue, afterValue) => {
    const before = beforeValue ?? "";
    const after = afterValue ?? "";
    if (before !== after) {
      changedFields.push({ label, before, after });
    }
  }, "diff");
  diff("Pend\xEAncia", existing.nota_pendencia, pendencia);
  diff("Status", existing.nota_status, status);
  diff("Ativo", existing.id_ativo, ativo.id);
  diff("OS", existing.id_os, idOs);
  diff("Programada", existing.nota_data_programada, dataProgramada);
  diff("Realizada", existing.nota_data_realizada, dataRealizada);
  diff("Obs PCM", existing.nota_observacao_pcm, descricaoPcm);
  diff("Obs T\xE9cnico", existing.nota_observacao_tecnico, descricaoTecnico);
  if (!changedFields.length) {
    return Response.json(
      { error: "Nenhuma altera\xE7\xE3o detectada." },
      { status: 400 }
    );
  }
  await env.DB.prepare(
    `UPDATE tb_nota
       SET ${updates.join(", ")}
       WHERE IDNOTA = ? AND company_id = ?`
  ).bind(...values).run();
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const resumo = changedFields.map((change) => `${change.label}: ${change.before || "-"} -> ${change.after || "-"}`).join(" | ");
  await env.DB.prepare(
    `INSERT INTO tb_nota_alteracao (
       company_id,
       IDNOTA,
       usuario_id,
       data_hora,
       campos_alterados
     ) VALUES (?, ?, ?, ?, ?)`
  ).bind(auth.company_id, notaId, auth.user_id, now, resumo).run();
  const nota = await fetchNotaWithAsset(env, auth.company_id, notaId);
  if (!nota) {
    return Response.json(
      { error: "Nota atualizada, mas nao foi possivel recuperar os dados." },
      { status: 500 }
    );
  }
  return Response.json({ nota });
}
__name(handleUpdateNota, "handleUpdateNota");
function normalizeBooleanFlag(value, fallback) {
  if (value === false || value === "false" || value === 0 || value === "0") {
    return 0;
  }
  if (value === true || value === "true" || value === 1 || value === "1") {
    return 1;
  }
  return fallback;
}
__name(normalizeBooleanFlag, "normalizeBooleanFlag");
function normalizeOptionalString(value) {
  const text = String(value ?? "").trim();
  return text ? text : null;
}
__name(normalizeOptionalString, "normalizeOptionalString");
async function handleListTarefas(request, env) {
  assertJwtSecret(env);
  const auth = await requireAuth(request, env);
  if (!auth) {
    return Response.json({ error: "Token invalido." }, { status: 401 });
  }
  const permissionError = await requirePermission(env, auth, "tarefas", "leitura");
  if (permissionError) return permissionError;
  const url = new URL(request.url);
  const pageParam = Number(url.searchParams.get("page") ?? "1");
  const perPageParam = Number(url.searchParams.get("per_page") ?? "20");
  const sortKey = url.searchParams.get("sort") === "tarefa" ? "tarefa" : "sigla";
  const sortDir = url.searchParams.get("order") === "desc" ? "DESC" : "ASC";
  const page = Math.max(1, Number.isFinite(pageParam) ? Math.trunc(pageParam) : 1);
  const perPage = Math.min(
    100,
    Math.max(5, Number.isFinite(perPageParam) ? Math.trunc(perPageParam) : 20)
  );
  const conditions = ["company_id = ?"];
  const values = [auth.company_id];
  const siglaFilter = normalizeOptionalString(url.searchParams.get("sigla"));
  if (siglaFilter) {
    conditions.push("sigla LIKE ?");
    values.push(`%${siglaFilter}%`);
  }
  const sistemaFilter = normalizeOptionalString(url.searchParams.get("sistema"));
  if (sistemaFilter) {
    conditions.push("sistema LIKE ?");
    values.push(`%${sistemaFilter}%`);
  }
  const activeParam = url.searchParams.get("active");
  if (activeParam === "false") {
    conditions.push("active = ?");
    values.push(0);
  } else if (activeParam === "true" || activeParam === null) {
    conditions.push("active = ?");
    values.push(1);
  }
  const countResult = await env.DB.prepare(
    `SELECT COUNT(*) AS total
       FROM tb_tarefas
       WHERE ${conditions.join(" AND ")}`
  ).bind(...values).first();
  const offset = (page - 1) * perPage;
  const query = env.DB.prepare(
    `SELECT id,
            company_id,
            id_sigla,
            sigla,
            tarefa,
            medicao,
            criticidade,
            periodicidade,
            sub_sistema,
            sistema,
            codigo,
            active,
            created_at,
            updated_at,
            created_by,
            updated_by
     FROM tb_tarefas
     WHERE ${conditions.join(" AND ")}
     ORDER BY ${sortKey} ${sortDir}
     LIMIT ? OFFSET ?`
  );
  const result = await query.bind(...values, perPage, offset).all();
  const tarefas = result.results.map((row) => ({
    ...row,
    medicao: row.medicao === 1,
    criticidade: row.criticidade === 1,
    active: row.active === 1
  }));
  return Response.json({
    tarefas,
    meta: {
      total: countResult?.total ?? 0,
      page,
      per_page: perPage
    }
  });
}
__name(handleListTarefas, "handleListTarefas");
async function handleCreateTarefa(request, env) {
  assertJwtSecret(env);
  const auth = await requireAuth(request, env);
  if (!auth) {
    return Response.json({ error: "Token invalido." }, { status: 401 });
  }
  const permissionError = await requirePermission(env, auth, "tarefas", "criacao");
  if (permissionError) return permissionError;
  const payload = await readJson(request);
  if (!payload) {
    return Response.json({ error: "Dados invalidos." }, { status: 400 });
  }
  const sigla = String(payload.sigla || "").trim();
  const tarefa = String(payload.tarefa || "").trim();
  const codigo = String(payload.codigo || "").trim();
  if (!sigla || !tarefa) {
    return Response.json(
      { error: "Sigla e tarefa sao obrigatorios." },
      { status: 400 }
    );
  }
  if (!codigo) {
    return Response.json(
      { error: "Codigo da tarefa e obrigatorio." },
      { status: 400 }
    );
  }
  if (tarefa.length > 255) {
    return Response.json(
      { error: "A descricao da tarefa nao pode ultrapassar 255 caracteres." },
      { status: 400 }
    );
  }
  const periodicidadeRaw = Number(payload.periodicidade ?? "");
  if (!Number.isFinite(periodicidadeRaw)) {
    return Response.json(
      { error: "Periodicidade invalida." },
      { status: 400 }
    );
  }
  const periodicidade = Math.trunc(periodicidadeRaw);
  if (periodicidade < 1 || periodicidade > 60) {
    return Response.json(
      { error: "Periodicidade deve estar entre 1 e 60." },
      { status: 400 }
    );
  }
  const idSigla = String(payload.id_sigla || sigla).trim();
  if (!idSigla) {
    return Response.json(
      { error: "Identificador da sigla e obrigatorio." },
      { status: 400 }
    );
  }
  const existing = await env.DB.prepare(
    `SELECT id
       FROM tb_tarefas
       WHERE company_id = ? AND sigla = ? AND codigo = ?`
  ).bind(auth.company_id, sigla, codigo).first();
  if (existing) {
    return Response.json(
      { error: "Ja existe uma tarefa com essa sigla e codigo." },
      { status: 409 }
    );
  }
  const medicao = normalizeBooleanFlag(payload.medicao, 0);
  const criticidade = normalizeBooleanFlag(payload.criticidade, 0);
  const active = normalizeBooleanFlag(payload.active, 1);
  const sistema = normalizeOptionalString(payload.sistema);
  const subSistema = normalizeOptionalString(payload.sub_sistema);
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const id = crypto.randomUUID();
  await env.DB.prepare(
    `INSERT INTO tb_tarefas (
         id,
         company_id,
         id_sigla,
         sigla,
         tarefa,
         medicao,
         criticidade,
         periodicidade,
         sub_sistema,
         sistema,
         codigo,
         active,
         created_at,
         updated_at,
         created_by,
         updated_by
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    id,
    auth.company_id,
    idSigla,
    sigla,
    tarefa,
    medicao,
    criticidade,
    periodicidade,
    subSistema,
    sistema,
    codigo,
    active,
    now,
    now,
    auth.user_id,
    auth.user_id
  ).run();
  return Response.json({ ok: true, id });
}
__name(handleCreateTarefa, "handleCreateTarefa");
async function handleUpdateTarefa(request, env) {
  assertJwtSecret(env);
  const auth = await requireAuth(request, env);
  if (!auth) {
    return Response.json({ error: "Token invalido." }, { status: 401 });
  }
  const permissionError = await requirePermission(env, auth, "tarefas", "edicao");
  if (permissionError) return permissionError;
  const payload = await readJson(request);
  if (!payload) {
    return Response.json({ error: "Dados invalidos." }, { status: 400 });
  }
  const tarefaId = String(payload.id || "").trim();
  if (!tarefaId) {
    return Response.json({ error: "ID da tarefa obrigatorio." }, { status: 400 });
  }
  const existing = await env.DB.prepare(
    `SELECT *
       FROM tb_tarefas
       WHERE id = ? AND company_id = ?`
  ).bind(tarefaId, auth.company_id).first();
  if (!existing) {
    return Response.json({ error: "Tarefa nao encontrada." }, { status: 404 });
  }
  const sigla = String(payload.sigla ?? existing.sigla).trim();
  const codigo = String(payload.codigo ?? existing.codigo).trim();
  const tarefa = String(payload.tarefa ?? existing.tarefa).trim();
  if (!sigla || !codigo || !tarefa) {
    return Response.json(
      { error: "Sigla, codigo e tarefa sao obrigatorios." },
      { status: 400 }
    );
  }
  if (tarefa.length > 255) {
    return Response.json(
      { error: "A descricao da tarefa nao pode ultrapassar 255 caracteres." },
      { status: 400 }
    );
  }
  const periodicidadeRaw = payload.periodicidade !== void 0 ? Number(payload.periodicidade) : existing.periodicidade;
  if (!Number.isFinite(periodicidadeRaw)) {
    return Response.json(
      { error: "Periodicidade invalida." },
      { status: 400 }
    );
  }
  const periodicidade = Math.trunc(periodicidadeRaw);
  if (periodicidade < 1 || periodicidade > 60) {
    return Response.json(
      { error: "Periodicidade deve estar entre 1 e 60." },
      { status: 400 }
    );
  }
  const idSigla = String(payload.id_sigla ?? existing.id_sigla).trim();
  if (!idSigla) {
    return Response.json(
      { error: "Identificador da sigla e obrigatorio." },
      { status: 400 }
    );
  }
  if (sigla !== existing.sigla || codigo !== existing.codigo) {
    const conflict = await env.DB.prepare(
      `SELECT id
         FROM tb_tarefas
         WHERE company_id = ? AND sigla = ? AND codigo = ? AND id != ?`
    ).bind(auth.company_id, sigla, codigo, tarefaId).first();
    if (conflict) {
      return Response.json(
        { error: "Ja existe uma tarefa com essa sigla e codigo." },
        { status: 409 }
      );
    }
  }
  const medicao = normalizeBooleanFlag(payload.medicao, existing.medicao);
  const criticidade = normalizeBooleanFlag(
    payload.criticidade,
    existing.criticidade
  );
  const active = normalizeBooleanFlag(payload.active, existing.active);
  const sistema = payload.sistema !== void 0 ? normalizeOptionalString(payload.sistema) : existing.sistema;
  const subSistema = payload.sub_sistema !== void 0 ? normalizeOptionalString(payload.sub_sistema) : existing.sub_sistema;
  const now = (/* @__PURE__ */ new Date()).toISOString();
  await env.DB.prepare(
    `UPDATE tb_tarefas
       SET id_sigla = ?,
           sigla = ?,
           tarefa = ?,
           medicao = ?,
           criticidade = ?,
           periodicidade = ?,
           sub_sistema = ?,
           sistema = ?,
           codigo = ?,
           active = ?,
           updated_at = ?,
           updated_by = ?
       WHERE id = ? AND company_id = ?`
  ).bind(
    idSigla,
    sigla,
    tarefa,
    medicao,
    criticidade,
    periodicidade,
    subSistema,
    sistema,
    codigo,
    active,
    now,
    auth.user_id,
    tarefaId,
    auth.company_id
  ).run();
  return Response.json({ ok: true });
}
__name(handleUpdateTarefa, "handleUpdateTarefa");
async function fetchNotaWithAsset(env, companyId, notaId) {
  return env.DB.prepare(
    `SELECT n.IDNOTA,
              n.company_id,
              n.id_ativo,
              n.id_os,
              n.nota_pendencia,
              n.nota_status,
              n.nota_data_criada,
              n.nota_data_programada,
              n.nota_data_realizada,
              n.nota_observacao_pcm,
              n.nota_observacao_tecnico,
              a.ATIVO_CODPE,
              a.ATIVO_DESCRITIVO_OS
       FROM tb_nota n
       LEFT JOIN tb_ativo a ON a.id = n.id_ativo AND a.company_id = n.company_id
       WHERE n.company_id = ? AND n.IDNOTA = ?`
  ).bind(companyId, notaId).first();
}
__name(fetchNotaWithAsset, "fetchNotaWithAsset");
async function handleDeleteComponente(request, env) {
  assertJwtSecret(env);
  const auth = await requireAuth(request, env);
  if (!auth) {
    return Response.json({ error: "Token invalido." }, { status: 401 });
  }
  const permissionError = await requirePermission(
    env,
    auth,
    "componentes",
    "exclusao"
  );
  if (permissionError) return permissionError;
  const url = new URL(request.url);
  const segments = url.pathname.split("/").filter(Boolean);
  const rawId = segments[segments.length - 1];
  const componentId = Number(rawId ?? "");
  if (!Number.isFinite(componentId)) {
    return Response.json({ error: "ID invalido." }, { status: 400 });
  }
  const result = await env.DB.prepare(
    "DELETE FROM tb_componente WHERE IDCOMPONETE = ? AND company_id = ?"
  ).bind(componentId, auth.company_id).run();
  if ((result.meta?.changes ?? 0) === 0) {
    return Response.json({ error: "Componente nao encontrado." }, { status: 404 });
  }
  return Response.json({ ok: true });
}
__name(handleDeleteComponente, "handleDeleteComponente");
async function fetchComponenteWithAsset(env, companyId, componentId) {
  return env.DB.prepare(
    `SELECT c.IDCOMPONETE,
              c.company_id,
              c.IDATIVO,
              c.COMP_NOME,
              c.COMP_SERIAL,
              c.COMP_DATA,
              c.COMP_MODELO,
              c.COMP_DESCRICAO,
              a.ATIVO_CODPE,
              a.ATIVO_DESCRITIVO_OS,
              a.ATIVO_SIGLA,
              a.ATIVO_COORDENACAO,
              a.ATIVO_EQUIPE
       FROM tb_componente c
       LEFT JOIN tb_ativo a ON a.id = c.IDATIVO AND a.company_id = c.company_id
       WHERE c.company_id = ? AND c.IDCOMPONETE = ?`
  ).bind(companyId, componentId).first();
}
__name(fetchComponenteWithAsset, "fetchComponenteWithAsset");
async function handleGetAtivo(request, env) {
  assertJwtSecret(env);
  const auth = await requireAuth(request, env);
  if (!auth) {
    return Response.json({ error: "Token invalido." }, { status: 401 });
  }
  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  const codpe = url.searchParams.get("codpe");
  if (!id && !codpe) {
    return Response.json({ error: "id ou codpe obrigatorio." }, { status: 400 });
  }
  const query = id ? env.DB.prepare(
    `SELECT *
         FROM tb_ativo
         WHERE id = ? AND company_id = ?`
  ).bind(id, auth.company_id) : env.DB.prepare(
    `SELECT *
         FROM tb_ativo
         WHERE ATIVO_CODPE = ? AND company_id = ?`
  ).bind(codpe, auth.company_id);
  const ativo = await query.first();
  if (!ativo) {
    return Response.json({ error: "Ativo nao encontrado." }, { status: 404 });
  }
  return Response.json({ ativo });
}
__name(handleGetAtivo, "handleGetAtivo");
async function handleCreateAtivo(request, env) {
  assertJwtSecret(env);
  const auth = await requireAuth(request, env);
  if (!auth) {
    return Response.json({ error: "Token invalido." }, { status: 401 });
  }
  const payload = await readJson(request);
  if (!payload) {
    return Response.json({ error: "Dados invalidos." }, { status: 400 });
  }
  const ativoEmpresa = normalizeAtivoField(payload.ATIVO_EMPRESA);
  const ativoCodpe = normalizeAtivoField(payload.ATIVO_CODPE);
  const ativoDescritivo = normalizeAtivoField(payload.ATIVO_DESCRITIVO_OS);
  const ativoStatus = normalizeAtivoField(payload.ATIVO_STATUS);
  const ativoCoordenacao = normalizeAtivoField(payload.ATIVO_COORDENACAO);
  const ativoEquipe = normalizeAtivoField(payload.ATIVO_EQUIPE);
  const ativoMonitorados = normalizeAtivoField(payload.ATIVO_MONITORADOS);
  const ativoSigla = normalizeAtivoField(payload.ATIVO_SIGLA);
  const ativoCiclo = normalizeAtivoField(payload.ATIVO_CICLO);
  const contadorCiclo = normalizeAtivoField(payload.CONTADOR_CICLO);
  const ativoTolerancia = normalizeAtivoField(payload.ATIVO_TOLERANCIA);
  const ativoClasse = normalizeAtivoField(payload.ATIVO_CLASSE);
  const ativoGrupo = normalizeAtivoField(payload.ATIVO_GRUPO);
  const ativoOea = normalizeAtivoField(payload.ATIVO_OEA);
  const ativoTmm = normalizeAtivoField(payload.ATIVO_TMM);
  const requiredFields = [
    ativoEmpresa,
    ativoCodpe,
    ativoDescritivo,
    ativoStatus,
    ativoCoordenacao,
    ativoEquipe,
    ativoMonitorados,
    ativoSigla,
    ativoCiclo,
    contadorCiclo,
    ativoTolerancia,
    ativoClasse,
    ativoGrupo,
    ativoOea,
    ativoTmm
  ];
  if (requiredFields.some((value) => !value)) {
    return Response.json(
      { error: "Preencha todos os campos obrigatorios." },
      { status: 400 }
    );
  }
  if (ativoCoordenacao.length > 20) {
    return Response.json(
      { error: "Coordenacao deve ter no maximo 20 caracteres." },
      { status: 400 }
    );
  }
  if (ativoEquipe.length > 10) {
    return Response.json(
      { error: "Equipe deve ter no maximo 10 caracteres." },
      { status: 400 }
    );
  }
  const company = await env.DB.prepare(
    "SELECT id, status FROM tb_company WHERE id = ?"
  ).bind(auth.company_id).first();
  if (!company || company.status !== "ativo") {
    return Response.json({ error: "Empresa invalida." }, { status: 400 });
  }
  const estrutura = await env.DB.prepare(
    `SELECT id FROM tb_estrutura
       WHERE company_id = ? AND coordenacao = ? AND equipe = ? AND status = 'ativo' AND execucao = 'sim'`
  ).bind(auth.company_id, ativoCoordenacao, ativoEquipe).first();
  if (!estrutura) {
    return Response.json(
      { error: "Coordenacao/equipe invalida." },
      { status: 400 }
    );
  }
  const conflict = await env.DB.prepare(
    "SELECT id FROM tb_ativo WHERE company_id = ? AND ATIVO_CODPE = ?"
  ).bind(auth.company_id, ativoCodpe).first();
  if (conflict) {
    return Response.json({ error: "ATIVO_CODPE ja existe." }, { status: 409 });
  }
  const ativoId = crypto.randomUUID();
  const ativoContador = 1;
  const optionalField = /* @__PURE__ */ __name((value) => {
    const normalized = value ? String(value).trim() : "";
    return normalized ? normalized : null;
  }, "optionalField");
  const insertValues = {
    id: ativoId,
    company_id: auth.company_id,
    ATIVO_EMPRESA: ativoEmpresa,
    ATIVO_CODPE: ativoCodpe,
    ATIVO_DESCRITIVO_OS: ativoDescritivo,
    ATIVO_STATUS: ativoStatus,
    ATIVO_COORDENACAO: ativoCoordenacao,
    ATIVO_EQUIPE: ativoEquipe,
    ATIVO_MONITORADOS: ativoMonitorados,
    ATIVO_SIGLA: ativoSigla,
    ATIVO_CICLO: ativoCiclo,
    ATIVO_CONTADOR: ativoContador,
    CONTADOR_CICLO: contadorCiclo,
    ATIVO_TOLERANCIA: ativoTolerancia,
    ATIVO_CLASSE: ativoClasse,
    ATIVO_GRUPO: ativoGrupo,
    ATIVO_OEA: ativoOea,
    ATIVO_TMM: ativoTmm,
    ATIVO_LATITUDE: optionalField(payload.ATIVO_LATITUDE),
    ATIVO_LONGITUDE: optionalField(payload.ATIVO_LONGITUDE),
    ATIVO_ULTIMA_MANUT: optionalField(payload.ATIVO_ULTIMA_MANUT),
    ATIVO_MODELO_POSTE: optionalField(payload.ATIVO_MODELO_POSTE),
    ATIVO_MODELO_RELE: optionalField(payload.ATIVO_MODELO_RELE),
    ATIVO_MODELO_DDS: optionalField(payload.ATIVO_MODELO_DDS),
    ATIVO_DDS_SERIAL: optionalField(payload.ATIVO_DDS_SERIAL),
    ATIVO_DDS_DTQ: optionalField(payload.ATIVO_DDS_DTQ),
    ATIVO_MYTRAIN: optionalField(payload.ATIVO_MYTRAIN),
    ATIVO_JAMPER1: optionalField(payload.ATIVO_JAMPER1),
    ATIVO_JAMPER2: optionalField(payload.ATIVO_JAMPER2),
    ATIVO_MODELO: optionalField(payload.ATIVO_MODELO),
    ATIVO_OBSERVACAO: optionalField(payload.ATIVO_OBSERVACAO)
  };
  await env.DB.prepare(
    `INSERT INTO tb_ativo (
      id,
      company_id,
      ATIVO_EMPRESA,
      ATIVO_CODPE,
      ATIVO_DESCRITIVO_OS,
      ATIVO_STATUS,
      ATIVO_COORDENACAO,
      ATIVO_EQUIPE,
      ATIVO_MONITORADOS,
      ATIVO_SIGLA,
      ATIVO_CICLO,
      ATIVO_CONTADOR,
      CONTADOR_CICLO,
      ATIVO_TOLERANCIA,
      ATIVO_CLASSE,
      ATIVO_GRUPO,
      ATIVO_OEA,
      ATIVO_TMM,
      ATIVO_LATITUDE,
      ATIVO_LONGITUDE,
      ATIVO_ULTIMA_MANUT,
      ATIVO_MODELO_POSTE,
      ATIVO_MODELO_RELE,
      ATIVO_MODELO_DDS,
      ATIVO_DDS_SERIAL,
      ATIVO_DDS_DTQ,
      ATIVO_MYTRAIN,
      ATIVO_JAMPER1,
      ATIVO_JAMPER2,
      ATIVO_MODELO,
      ATIVO_OBSERVACAO
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    insertValues.id,
    insertValues.company_id,
    insertValues.ATIVO_EMPRESA,
    insertValues.ATIVO_CODPE,
    insertValues.ATIVO_DESCRITIVO_OS,
    insertValues.ATIVO_STATUS,
    insertValues.ATIVO_COORDENACAO,
    insertValues.ATIVO_EQUIPE,
    insertValues.ATIVO_MONITORADOS,
    insertValues.ATIVO_SIGLA,
    insertValues.ATIVO_CICLO,
    insertValues.ATIVO_CONTADOR,
    insertValues.CONTADOR_CICLO,
    insertValues.ATIVO_TOLERANCIA,
    insertValues.ATIVO_CLASSE,
    insertValues.ATIVO_GRUPO,
    insertValues.ATIVO_OEA,
    insertValues.ATIVO_TMM,
    insertValues.ATIVO_LATITUDE,
    insertValues.ATIVO_LONGITUDE,
    insertValues.ATIVO_ULTIMA_MANUT,
    insertValues.ATIVO_MODELO_POSTE,
    insertValues.ATIVO_MODELO_RELE,
    insertValues.ATIVO_MODELO_DDS,
    insertValues.ATIVO_DDS_SERIAL,
    insertValues.ATIVO_DDS_DTQ,
    insertValues.ATIVO_MYTRAIN,
    insertValues.ATIVO_JAMPER1,
    insertValues.ATIVO_JAMPER2,
    insertValues.ATIVO_MODELO,
    insertValues.ATIVO_OBSERVACAO
  ).run();
  await logAtivoHistory(env, {
    companyId: auth.company_id,
    ativoId,
    action: "criado",
    beforeData: null,
    afterData: JSON.stringify(insertValues),
    changedByUserId: auth.user_id,
    changedByName: auth.nome
  });
  const ativo = await env.DB.prepare(
    `SELECT * FROM tb_ativo WHERE id = ? AND company_id = ?`
  ).bind(ativoId, auth.company_id).first();
  return Response.json({ ativo }, { status: 201 });
}
__name(handleCreateAtivo, "handleCreateAtivo");
async function handleUpdateAtivo(request, env) {
  assertJwtSecret(env);
  const auth = await requireAuth(request, env);
  if (!auth) {
    return Response.json({ error: "Token invalido." }, { status: 401 });
  }
  const payload = await readJson(request);
  if (!payload) {
    return Response.json({ error: "Dados invalidos." }, { status: 400 });
  }
  const id = String(payload.id || "").trim();
  if (!id) {
    return Response.json({ error: "ID obrigatorio." }, { status: 400 });
  }
  const existing = await env.DB.prepare(
    `SELECT * FROM tb_ativo WHERE id = ? AND company_id = ?`
  ).bind(id, auth.company_id).first();
  if (!existing) {
    return Response.json({ error: "Ativo nao encontrado." }, { status: 404 });
  }
  if (payload.ATIVO_STATUS !== void 0) {
    const nextStatus = String(payload.ATIVO_STATUS || "").trim().toLowerCase();
    if (nextStatus === "inativo" && existing.ATIVO_STATUS.toLowerCase() !== "inativo") {
      const permissionError = await requirePermission(
        env,
        auth,
        "ativos",
        "exclusao"
      );
      if (permissionError) return permissionError;
    }
  }
  const nextStatusValue = payload.ATIVO_STATUS !== void 0 ? String(payload.ATIVO_STATUS || "").trim() : existing.ATIVO_STATUS;
  const statusChanged = payload.ATIVO_STATUS !== void 0 && nextStatusValue.toLowerCase() !== existing.ATIVO_STATUS.toLowerCase();
  const normalizedStatus = nextStatusValue.toLowerCase();
  const statusLogPayload = payload.status_log ?? void 0;
  let statusLogEntry = null;
  if (statusChanged && normalizedStatus !== "ok") {
    const observacao = String(statusLogPayload?.observacao ?? "").trim();
    const dataAlteracao = String(statusLogPayload?.data_alteracao ?? "").trim();
    if (!observacao || !dataAlteracao) {
      return Response.json(
        { error: "Observa\xE7\xE3o e data de altera\xE7\xE3o s\xE3o obrigat\xF3rias para status n\xE3o OK." },
        { status: 400 }
      );
    }
    const previsaoRaw = statusLogPayload?.data_previsao_reparo;
    const previsao = previsaoRaw === void 0 || previsaoRaw === null ? null : String(previsaoRaw).trim() || null;
    statusLogEntry = {
      observacao,
      dataAlteracao,
      dataPrevisaoReparo: previsao
    };
  }
  const requiredFieldsToCheck = [
    ["ATIVO_EMPRESA", payload.ATIVO_EMPRESA],
    ["ATIVO_CODPE", payload.ATIVO_CODPE],
    ["ATIVO_DESCRITIVO_OS", payload.ATIVO_DESCRITIVO_OS],
    ["ATIVO_STATUS", payload.ATIVO_STATUS],
    ["ATIVO_COORDENACAO", payload.ATIVO_COORDENACAO],
    ["ATIVO_EQUIPE", payload.ATIVO_EQUIPE],
    ["ATIVO_MONITORADOS", payload.ATIVO_MONITORADOS],
    ["ATIVO_SIGLA", payload.ATIVO_SIGLA],
    ["ATIVO_CICLO", payload.ATIVO_CICLO],
    ["CONTADOR_CICLO", payload.CONTADOR_CICLO],
    ["ATIVO_TOLERANCIA", payload.ATIVO_TOLERANCIA],
    ["ATIVO_CLASSE", payload.ATIVO_CLASSE],
    ["ATIVO_GRUPO", payload.ATIVO_GRUPO],
    ["ATIVO_OEA", payload.ATIVO_OEA],
    ["ATIVO_TMM", payload.ATIVO_TMM]
  ];
  for (const [field, value] of requiredFieldsToCheck) {
    if (value === void 0) continue;
    if (!String(value ?? "").trim()) {
      return Response.json(
        { error: `Campo obrigatorio vazio: ${field}.` },
        { status: 400 }
      );
    }
  }
  const updates = [];
  const values = [];
  const applyUpdate = /* @__PURE__ */ __name((field, value) => {
    if (value === void 0) return;
    const normalized = value === null ? "" : String(value).trim();
    if (!normalized) {
      return;
    }
    if (existing[field] === normalized) return;
    updates.push(`${field} = ?`);
    values.push(normalized);
  }, "applyUpdate");
  applyUpdate("ATIVO_EMPRESA", payload.ATIVO_EMPRESA);
  applyUpdate("ATIVO_CODPE", payload.ATIVO_CODPE);
  applyUpdate("ATIVO_DESCRITIVO_OS", payload.ATIVO_DESCRITIVO_OS);
  applyUpdate("ATIVO_STATUS", payload.ATIVO_STATUS);
  applyUpdate("ATIVO_COORDENACAO", payload.ATIVO_COORDENACAO);
  applyUpdate("ATIVO_EQUIPE", payload.ATIVO_EQUIPE);
  applyUpdate("ATIVO_MONITORADOS", payload.ATIVO_MONITORADOS);
  applyUpdate("ATIVO_SIGLA", payload.ATIVO_SIGLA);
  applyUpdate("ATIVO_CICLO", payload.ATIVO_CICLO);
  if (payload.ATIVO_CONTADOR !== void 0 && payload.ATIVO_CONTADOR !== null) {
    const contadorValue = Number(payload.ATIVO_CONTADOR);
    if (Number.isNaN(contadorValue)) {
      return Response.json(
        { error: "ATIVO_CONTADOR deve ser numerico." },
        { status: 400 }
      );
    }
    if (contadorValue !== existing.ATIVO_CONTADOR) {
      updates.push("ATIVO_CONTADOR = ?");
      values.push(contadorValue);
    }
  }
  applyUpdate("CONTADOR_CICLO", payload.CONTADOR_CICLO);
  applyUpdate("ATIVO_TOLERANCIA", payload.ATIVO_TOLERANCIA);
  applyUpdate("ATIVO_CLASSE", payload.ATIVO_CLASSE);
  applyUpdate("ATIVO_GRUPO", payload.ATIVO_GRUPO);
  applyUpdate("ATIVO_OEA", payload.ATIVO_OEA);
  applyUpdate("ATIVO_TMM", payload.ATIVO_TMM);
  const optionalUpdate = /* @__PURE__ */ __name((field, value) => {
    if (value === void 0) return;
    const normalized = value ? String(value).trim() : null;
    if (existing[field] === normalized) return;
    updates.push(`${field} = ?`);
    values.push(normalized);
  }, "optionalUpdate");
  optionalUpdate("ATIVO_LATITUDE", payload.ATIVO_LATITUDE);
  optionalUpdate("ATIVO_LONGITUDE", payload.ATIVO_LONGITUDE);
  optionalUpdate("ATIVO_ULTIMA_MANUT", payload.ATIVO_ULTIMA_MANUT);
  optionalUpdate("ATIVO_MODELO_POSTE", payload.ATIVO_MODELO_POSTE);
  optionalUpdate("ATIVO_MODELO_RELE", payload.ATIVO_MODELO_RELE);
  optionalUpdate("ATIVO_MODELO_DDS", payload.ATIVO_MODELO_DDS);
  optionalUpdate("ATIVO_DDS_SERIAL", payload.ATIVO_DDS_SERIAL);
  optionalUpdate("ATIVO_DDS_DTQ", payload.ATIVO_DDS_DTQ);
  optionalUpdate("ATIVO_MYTRAIN", payload.ATIVO_MYTRAIN);
  optionalUpdate("ATIVO_JAMPER1", payload.ATIVO_JAMPER1);
  optionalUpdate("ATIVO_JAMPER2", payload.ATIVO_JAMPER2);
  optionalUpdate("ATIVO_MODELO", payload.ATIVO_MODELO);
  optionalUpdate("ATIVO_OBSERVACAO", payload.ATIVO_OBSERVACAO);
  if (!updates.length) {
    return Response.json({ error: "Nada para atualizar." }, { status: 400 });
  }
  const nextCodpe = payload.ATIVO_CODPE !== void 0 && String(payload.ATIVO_CODPE).trim().length > 0 ? String(payload.ATIVO_CODPE).trim() : existing.ATIVO_CODPE;
  const nextDescritivo = payload.ATIVO_DESCRITIVO_OS !== void 0 ? String(payload.ATIVO_DESCRITIVO_OS).trim() : existing.ATIVO_DESCRITIVO_OS;
  const nextCoordenacao = payload.ATIVO_COORDENACAO !== void 0 ? String(payload.ATIVO_COORDENACAO).trim() : existing.ATIVO_COORDENACAO;
  const nextEquipe = payload.ATIVO_EQUIPE !== void 0 ? String(payload.ATIVO_EQUIPE).trim() : existing.ATIVO_EQUIPE;
  if (nextCoordenacao.length > 20) {
    return Response.json(
      { error: "Coordenacao deve ter no maximo 20 caracteres." },
      { status: 400 }
    );
  }
  if (nextEquipe.length > 10) {
    return Response.json(
      { error: "Equipe deve ter no maximo 10 caracteres." },
      { status: 400 }
    );
  }
  if (nextCoordenacao !== existing.ATIVO_COORDENACAO || nextEquipe !== existing.ATIVO_EQUIPE) {
    const estrutura = await env.DB.prepare(
      `SELECT id FROM tb_estrutura
       WHERE company_id = ? AND coordenacao = ? AND equipe = ? AND status = 'ativo' AND execucao = 'sim'`
    ).bind(auth.company_id, nextCoordenacao, nextEquipe).first();
    if (!estrutura) {
      return Response.json(
        { error: "Coordenacao/equipe invalida." },
        { status: 400 }
      );
    }
  }
  if (payload.ATIVO_CODPE !== void 0 && payload.ATIVO_CODPE !== null && String(payload.ATIVO_CODPE).trim() !== existing.ATIVO_CODPE) {
    const conflict = await env.DB.prepare(
      "SELECT id FROM tb_ativo WHERE company_id = ? AND ATIVO_CODPE = ? AND id != ?"
    ).bind(auth.company_id, String(payload.ATIVO_CODPE).trim(), id).first();
    if (conflict) {
      return Response.json({ error: "ATIVO_CODPE ja existe." }, { status: 409 });
    }
  }
  await env.DB.prepare(
    `UPDATE tb_ativo SET ${updates.join(", ")} WHERE id = ? AND company_id = ?`
  ).bind(...values, id, auth.company_id).run();
  const ativo = await env.DB.prepare(
    `SELECT * FROM tb_ativo WHERE id = ? AND company_id = ?`
  ).bind(id, auth.company_id).first();
  if (ativo) {
    await logAtivoHistory(env, {
      companyId: auth.company_id,
      ativoId: id,
      action: "atualizado",
      beforeData: JSON.stringify(existing),
      afterData: JSON.stringify(ativo),
      changedByUserId: auth.user_id,
      changedByName: auth.nome
    });
  }
  if (statusLogEntry && ativo) {
    await logAtivoStatusChange(env, {
      companyId: auth.company_id,
      ativoId: id,
      ativoCodpe: nextCodpe,
      ativoDescritivo: nextDescritivo,
      equipe: nextEquipe,
      status: nextStatusValue,
      observacao: statusLogEntry.observacao,
      dataAlteracao: statusLogEntry.dataAlteracao,
      dataPrevisaoReparo: statusLogEntry.dataPrevisaoReparo,
      changedByUserId: auth.user_id,
      changedByName: auth.nome
    });
  }
  return Response.json({ ativo });
}
__name(handleUpdateAtivo, "handleUpdateAtivo");
async function handleAtivoStatusHistory(request, env) {
  assertJwtSecret(env);
  const auth = await requireAuth(request, env);
  if (!auth) {
    return Response.json({ error: "Token invalido." }, { status: 401 });
  }
  const url = new URL(request.url);
  const ativoId = url.searchParams.get("ativo_id");
  if (!ativoId) {
    return Response.json({ error: "ativo_id obrigatorio." }, { status: 400 });
  }
  const result = await env.DB.prepare(
    `SELECT id,
            ativo_id,
            ativo_codpe,
            ativo_descritivo,
            equipe,
            status,
            observacao,
            data_alteracao,
            data_previsao_reparo,
            changed_by_user_id,
            changed_by_name,
            created_at
     FROM tb_ativo_status_log
     WHERE company_id = ? AND ativo_id = ?
     ORDER BY data_alteracao DESC`
  ).bind(auth.company_id, ativoId).all();
  return Response.json({ history: result.results });
}
__name(handleAtivoStatusHistory, "handleAtivoStatusHistory");
async function handleAtivoHistory(request, env) {
  assertJwtSecret(env);
  const auth = await requireAuth(request, env);
  if (!auth) {
    return Response.json({ error: "Token invalido." }, { status: 401 });
  }
  const url = new URL(request.url);
  const ativoId = url.searchParams.get("ativo_id");
  if (!ativoId) {
    return Response.json({ error: "ativo_id obrigatorio." }, { status: 400 });
  }
  const result = await env.DB.prepare(
    `SELECT id, company_id, ativo_id, action, before_data, after_data, changed_by_user_id, changed_by_name, created_at
     FROM tb_ativo_history
     WHERE company_id = ? AND ativo_id = ?
     ORDER BY created_at DESC`
  ).bind(auth.company_id, ativoId).all();
  return Response.json({ history: result.results });
}
__name(handleAtivoHistory, "handleAtivoHistory");
async function handleListOrderService(request, env) {
  assertJwtSecret(env);
  const auth = await requireAuth(request, env);
  if (!auth) {
    return Response.json({ error: "Token invalido." }, { status: 401 });
  }
  const url = new URL(request.url);
  const conditions = ["os.company_id = ?"];
  const values = [auth.company_id];
  const ano = url.searchParams.get("ano");
  const mes = url.searchParams.get("mes");
  if (ano) {
    conditions.push("os.os_ano = ?");
    values.push(Number(ano));
  }
  if (mes) {
    conditions.push("os.os_mes = ?");
    values.push(Number(mes));
  }
  const osNumeroRaw = url.searchParams.get("os_numero");
  if (osNumeroRaw) {
    const osNumero = Number(osNumeroRaw);
    if (!Number.isNaN(osNumero)) {
      conditions.push("os.os_numero = ?");
      values.push(osNumero);
    }
  }
  const statusList = (url.searchParams.get("status") || "").split(",").map((item) => item.trim().toUpperCase()).filter(Boolean);
  if (statusList.length) {
    conditions.push(`os.os_status IN (${statusList.map(() => "?").join(", ")})`);
    values.push(...statusList);
  }
  const tipo = normalizeOsTipo(url.searchParams.get("tipo"));
  if (tipo) {
    conditions.push("os.os_tipo = ?");
    values.push(tipo);
  }
  const pdm = normalizeFlag(url.searchParams.get("pdm"));
  if (pdm !== null) {
    conditions.push("os.os_pdm = ?");
    values.push(pdm);
  }
  const capex = normalizeFlag(url.searchParams.get("capex"));
  if (capex !== null) {
    conditions.push("os.os_capex = ?");
    values.push(capex);
  }
  const equipeList = (url.searchParams.get("equipe") || "").split(",").map((item) => item.trim()).filter(Boolean);
  if (equipeList.length) {
    conditions.push(`e.equipe IN (${equipeList.map(() => "?").join(", ")})`);
    values.push(...equipeList);
  }
  const coordenacao = url.searchParams.get("coordenacao");
  if (coordenacao) {
    conditions.push("e.coordenacao = ?");
    values.push(coordenacao);
  }
  const search = url.searchParams.get("search");
  if (search) {
    const terms = search.split(",").map((item) => item.trim()).filter(Boolean);
    const numericTerms = terms.filter((item) => /^[0-9]+$/.test(item));
    const textTerms = terms.filter((item) => !/^[0-9]+$/.test(item));
    const subConditions = [];
    if (numericTerms.length) {
      subConditions.push(
        `os.os_numero IN (${numericTerms.map(() => "?").join(", ")})`
      );
      values.push(...numericTerms.map(Number));
    }
    for (const term of textTerms) {
      subConditions.push("(a.ATIVO_CODPE LIKE ? OR a.ATIVO_DESCRITIVO_OS LIKE ?)");
      values.push(`%${term}%`, `%${term}%`);
    }
    if (subConditions.length) {
      conditions.push(`(${subConditions.join(" OR ")})`);
    }
  }
  const result = await env.DB.prepare(
    `SELECT os.id,
            os.os_numero,
            os.os_status,
            os.os_pdm,
            os.os_tipo,
            os.os_checklist,
            os.os_capex,
            os.os_programado1,
            os.os_programado2,
            os.os_programado3,
            os.os_programado4,
            os.os_programado5,
            os.os_realizado_em,
            os.os_obs_pcm,
            a.ATIVO_CODPE,
            a.ATIVO_DESCRITIVO_OS,
            a.ATIVO_EQUIPE
     FROM tb_order_service os
     JOIN tb_ativo a ON a.id = os.ativo_id
     JOIN tb_estrutura e ON e.id = os.estrutura_id
     WHERE ${conditions.join(" AND ")}
     ORDER BY os.os_numero DESC`
  ).bind(...values).all();
  return Response.json({ os: result.results });
}
__name(handleListOrderService, "handleListOrderService");
async function handleGetOrderService(request, env) {
  assertJwtSecret(env);
  const auth = await requireAuth(request, env);
  if (!auth) {
    return Response.json({ error: "Token invalido." }, { status: 401 });
  }
  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  if (!id) {
    return Response.json({ error: "id obrigatorio." }, { status: 400 });
  }
  const os = await env.DB.prepare(
    `SELECT os.*,
              a.ATIVO_CODPE,
              a.ATIVO_DESCRITIVO_OS,
              a.ATIVO_EQUIPE,
              e.coordenacao AS estrutura_coordenacao,
              e.equipe AS estrutura_equipe
       FROM tb_order_service os
       JOIN tb_ativo a ON a.id = os.ativo_id
       JOIN tb_estrutura e ON e.id = os.estrutura_id
       WHERE os.id = ? AND os.company_id = ?`
  ).bind(id, auth.company_id).first();
  if (!os) {
    return Response.json({ error: "OS nao encontrada." }, { status: 404 });
  }
  return Response.json({ os });
}
__name(handleGetOrderService, "handleGetOrderService");
async function handleCreateOrderService(request, env) {
  assertJwtSecret(env);
  const auth = await requireAuth(request, env);
  if (!auth) {
    return Response.json({ error: "Token invalido." }, { status: 401 });
  }
  const payload = await readJson(request);
  if (!payload) {
    return Response.json({ error: "Dados invalidos." }, { status: 400 });
  }
  const estruturaId = String(payload.estrutura_id || "").trim();
  const ativoIdsRaw = Array.isArray(payload.ativo_ids) ? payload.ativo_ids : [];
  const ativoIds = Array.from(
    new Set(ativoIdsRaw.map((id) => String(id || "").trim()).filter(Boolean))
  );
  const osTipo = normalizeOsTipo(payload.os_tipo);
  const osPdm = normalizeFlag(payload.os_pdm);
  const osChecklist = normalizeFlag(payload.os_checklist);
  const osCapex = normalizeFlag(payload.os_capex);
  const osStatus = normalizeOsStatus(payload.os_status || "CRIADO") || "CRIADO";
  const osAno = Number(payload.os_ano);
  const osMes = Number(payload.os_mes);
  const osObsPcm = payload.os_obs_pcm ? String(payload.os_obs_pcm).trim() : null;
  if (!estruturaId || !ativoIds.length || !osTipo) {
    return Response.json(
      { error: "Estrutura, ativos e tipo sao obrigatorios." },
      { status: 400 }
    );
  }
  if (osPdm === null || osChecklist === null || osCapex === null) {
    return Response.json({ error: "Flags invalidas." }, { status: 400 });
  }
  if (!Number.isInteger(osAno) || !Number.isInteger(osMes)) {
    return Response.json({ error: "Ano/mes invalidos." }, { status: 400 });
  }
  if (osMes < 1 || osMes > 12) {
    return Response.json({ error: "Mes invalido." }, { status: 400 });
  }
  const company = await env.DB.prepare(
    "SELECT id, status FROM tb_company WHERE id = ?"
  ).bind(auth.company_id).first();
  if (!company || company.status !== "ativo") {
    return Response.json({ error: "Empresa invalida." }, { status: 400 });
  }
  const estrutura = await env.DB.prepare(
    `SELECT id, coordenacao, equipe, status, execucao
     FROM tb_estrutura
     WHERE id = ? AND company_id = ?`
  ).bind(estruturaId, auth.company_id).first();
  if (!estrutura || estrutura.status !== "ativo" || estrutura.execucao !== "sim") {
    return Response.json({ error: "Estrutura invalida." }, { status: 400 });
  }
  const placeholders = ativoIds.map(() => "?").join(", ");
  const ativos = await env.DB.prepare(
    `SELECT id, ATIVO_EQUIPE
     FROM tb_ativo
     WHERE company_id = ? AND id IN (${placeholders})`
  ).bind(auth.company_id, ...ativoIds).all();
  if (ativos.results.length !== ativoIds.length) {
    return Response.json({ error: "Ativos invalidos." }, { status: 400 });
  }
  for (const ativo of ativos.results) {
    if (ativo.ATIVO_EQUIPE !== estrutura.equipe) {
      return Response.json(
        { error: "Ativo fora da equipe selecionada." },
        { status: 400 }
      );
    }
  }
  const maxRow = await env.DB.prepare(
    "SELECT COALESCE(MAX(os_numero), 0) AS max_numero FROM tb_order_service WHERE company_id = ?"
  ).bind(auth.company_id).first();
  let nextNumero = (maxRow?.max_numero ?? 0) + 1;
  const created = [];
  for (const ativo of ativos.results) {
    const osId = crypto.randomUUID();
    const numero = nextNumero++;
    await env.DB.prepare(
      `INSERT INTO tb_order_service (
        id,
        company_id,
        os_numero,
        estrutura_id,
        ativo_id,
        os_tipo,
        os_pdm,
        os_status,
        os_checklist,
        os_capex,
        os_realizado_em,
        os_programado1,
        os_programado2,
        os_programado3,
        os_programado4,
        os_programado5,
        os_obs_pcm,
        os_obs_tecnico,
        os_ano,
        os_mes,
        created_at,
        created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL, NULL, NULL, NULL, NULL, ?, NULL, ?, ?, datetime('now'), ?)`
    ).bind(
      osId,
      auth.company_id,
      numero,
      estruturaId,
      ativo.id,
      osTipo,
      osPdm,
      osStatus,
      osChecklist,
      osCapex,
      osObsPcm,
      osAno,
      osMes,
      auth.user_id
    ).run();
    const afterData = {
      id: osId,
      company_id: auth.company_id,
      os_numero: numero,
      estrutura_id: estruturaId,
      ativo_id: ativo.id,
      os_tipo: osTipo,
      os_pdm: osPdm,
      os_status: osStatus,
      os_checklist: osChecklist,
      os_capex: osCapex,
      os_obs_pcm: osObsPcm,
      os_ano: osAno,
      os_mes: osMes
    };
    await logOrderServiceHistory(env, {
      companyId: auth.company_id,
      orderServiceId: osId,
      action: "criado",
      beforeData: null,
      afterData: JSON.stringify(afterData),
      changedByUserId: auth.user_id,
      changedByName: auth.nome
    });
    created.push({ id: osId, os_numero: numero, ativo_id: ativo.id });
  }
  return Response.json({ created }, { status: 201 });
}
__name(handleCreateOrderService, "handleCreateOrderService");
async function handleUpdateOrderService(request, env) {
  assertJwtSecret(env);
  const auth = await requireAuth(request, env);
  if (!auth) {
    return Response.json({ error: "Token invalido." }, { status: 401 });
  }
  const payload = await readJson(request);
  if (!payload) {
    return Response.json({ error: "Dados invalidos." }, { status: 400 });
  }
  const id = String(payload.id || "").trim();
  if (!id) {
    return Response.json({ error: "ID obrigatorio." }, { status: 400 });
  }
  const existing = await env.DB.prepare(
    `SELECT * FROM tb_order_service WHERE id = ? AND company_id = ?`
  ).bind(id, auth.company_id).first();
  if (!existing) {
    return Response.json({ error: "OS nao encontrada." }, { status: 404 });
  }
  if (payload.os_programado1 !== void 0) {
    const todayKey = getLocalDateKey();
    const existingProgramado1 = normalizeDateOnly(existing.os_programado1);
    if (existing.os_status === "PROGRAMADO" && !existing.os_realizado_em && existingProgramado1 && existingProgramado1 < todayKey) {
      return Response.json(
        { error: "Semana 1 nao realizada nao pode ser alterada." },
        { status: 400 }
      );
    }
  }
  if (payload.os_status !== void 0) {
    const nextStatus = normalizeOsStatus(payload.os_status);
    if (nextStatus === "CANCELADO" && existing.os_status !== "CANCELADO") {
      const permissionError = await requirePermission(
        env,
        auth,
        "planejamento",
        "exclusao"
      );
      if (permissionError) return permissionError;
    }
  }
  const updates = [];
  const values = [];
  const updateOptionalText = /* @__PURE__ */ __name((field, value) => {
    if (value === void 0) return;
    const normalized = String(value ?? "").trim();
    const finalValue = normalized ? normalized : null;
    if (existing[field] === finalValue) return null;
    updates.push(`${field} = ?`);
    values.push(finalValue);
    return null;
  }, "updateOptionalText");
  const updateFlag = /* @__PURE__ */ __name((field, value) => {
    if (value === void 0) return;
    const normalized = normalizeFlag(value);
    if (normalized === null) {
      return Response.json({ error: `Flag invalida: ${field}.` }, { status: 400 });
    }
    if (existing[field] === normalized) return null;
    updates.push(`${field} = ?`);
    values.push(normalized);
    return null;
  }, "updateFlag");
  const updateTipo = /* @__PURE__ */ __name((value) => {
    if (value === void 0) return null;
    const normalized = normalizeOsTipo(value);
    if (!normalized) {
      return Response.json({ error: "Tipo invalido." }, { status: 400 });
    }
    if (existing.os_tipo === normalized) return null;
    updates.push("os_tipo = ?");
    values.push(normalized);
    return null;
  }, "updateTipo");
  const updateStatus = /* @__PURE__ */ __name((value) => {
    if (value === void 0) return null;
    const normalized = normalizeOsStatus(value);
    if (!normalized) {
      return Response.json({ error: "Status invalido." }, { status: 400 });
    }
    if (existing.os_status === normalized) return null;
    updates.push("os_status = ?");
    values.push(normalized);
    return null;
  }, "updateStatus");
  const responses = [
    updateOptionalText("os_obs_pcm", payload.os_obs_pcm),
    updateOptionalText("os_obs_tecnico", payload.os_obs_tecnico),
    updateOptionalText("os_programado1", payload.os_programado1),
    updateOptionalText("os_programado2", payload.os_programado2),
    updateOptionalText("os_programado3", payload.os_programado3),
    updateOptionalText("os_programado4", payload.os_programado4),
    updateOptionalText("os_programado5", payload.os_programado5),
    updateOptionalText("os_realizado_em", payload.os_realizado_em),
    updateFlag("os_pdm", payload.os_pdm),
    updateFlag("os_checklist", payload.os_checklist),
    updateFlag("os_capex", payload.os_capex),
    updateTipo(payload.os_tipo),
    updateStatus(payload.os_status)
  ];
  const errorResponse = responses.find((item) => item instanceof Response);
  if (errorResponse) return errorResponse;
  if (payload.os_ano !== void 0) {
    const value = Number(payload.os_ano);
    if (!Number.isInteger(value)) {
      return Response.json({ error: "Ano invalido." }, { status: 400 });
    }
    if (value !== existing.os_ano) {
      updates.push("os_ano = ?");
      values.push(value);
    }
  }
  if (payload.os_mes !== void 0) {
    const value = Number(payload.os_mes);
    if (!Number.isInteger(value) || value < 1 || value > 12) {
      return Response.json({ error: "Mes invalido." }, { status: 400 });
    }
    if (value !== existing.os_mes) {
      updates.push("os_mes = ?");
      values.push(value);
    }
  }
  let nextEstruturaId = existing.estrutura_id;
  let nextAtivoId = existing.ativo_id;
  if (payload.estrutura_id !== void 0) {
    nextEstruturaId = String(payload.estrutura_id || "").trim();
    if (!nextEstruturaId) {
      return Response.json({ error: "Estrutura invalida." }, { status: 400 });
    }
    if (nextEstruturaId !== existing.estrutura_id) {
      const estrutura = await env.DB.prepare(
        `SELECT id, equipe, status, execucao FROM tb_estrutura WHERE id = ? AND company_id = ?`
      ).bind(nextEstruturaId, auth.company_id).first();
      if (!estrutura || estrutura.status !== "ativo" || estrutura.execucao !== "sim") {
        return Response.json({ error: "Estrutura invalida." }, { status: 400 });
      }
      updates.push("estrutura_id = ?");
      values.push(nextEstruturaId);
    }
  }
  if (payload.ativo_id !== void 0) {
    nextAtivoId = String(payload.ativo_id || "").trim();
    if (!nextAtivoId) {
      return Response.json({ error: "Ativo invalido." }, { status: 400 });
    }
    if (nextAtivoId !== existing.ativo_id) {
      const ativo = await env.DB.prepare(
        `SELECT id, ATIVO_EQUIPE FROM tb_ativo WHERE id = ? AND company_id = ?`
      ).bind(nextAtivoId, auth.company_id).first();
      if (!ativo) {
        return Response.json({ error: "Ativo invalido." }, { status: 400 });
      }
      updates.push("ativo_id = ?");
      values.push(nextAtivoId);
    }
  }
  if (!updates.length) {
    return Response.json({ error: "Nada para atualizar." }, { status: 400 });
  }
  updates.push("updated_at = datetime('now')");
  updates.push("updated_by = ?");
  values.push(auth.user_id);
  await env.DB.prepare(
    `UPDATE tb_order_service SET ${updates.join(", ")} WHERE id = ? AND company_id = ?`
  ).bind(...values, id, auth.company_id).run();
  const os = await env.DB.prepare(
    `SELECT * FROM tb_order_service WHERE id = ? AND company_id = ?`
  ).bind(id, auth.company_id).first();
  if (os) {
    await logOrderServiceHistory(env, {
      companyId: auth.company_id,
      orderServiceId: id,
      action: "atualizado",
      beforeData: JSON.stringify(existing),
      afterData: JSON.stringify(os),
      changedByUserId: auth.user_id,
      changedByName: auth.nome
    });
  }
  return Response.json({ os });
}
__name(handleUpdateOrderService, "handleUpdateOrderService");
async function handleBulkUpdateOrderService(request, env) {
  assertJwtSecret(env);
  const auth = await requireAuth(request, env);
  if (!auth) {
    return Response.json({ error: "Token invalido." }, { status: 401 });
  }
  const payload = await readJson(request);
  if (!payload) {
    return Response.json({ error: "Dados invalidos." }, { status: 400 });
  }
  const idsRaw = Array.isArray(payload.ids) ? payload.ids : [];
  const ids = Array.from(
    new Set(idsRaw.map((id) => String(id || "").trim()).filter(Boolean))
  );
  if (!ids.length) {
    return Response.json({ error: "IDs obrigatorios." }, { status: 400 });
  }
  const nextStatus = payload.os_status !== void 0 ? normalizeOsStatus(payload.os_status) : null;
  const nextTipo = payload.os_tipo !== void 0 ? normalizeOsTipo(payload.os_tipo) : null;
  if (payload.os_status !== void 0 && !nextStatus) {
    return Response.json({ error: "Status invalido." }, { status: 400 });
  }
  if (payload.os_tipo !== void 0 && !nextTipo) {
    return Response.json({ error: "Tipo invalido." }, { status: 400 });
  }
  if (!nextStatus && !nextTipo) {
    return Response.json({ error: "Nada para atualizar." }, { status: 400 });
  }
  const permissionError = await requirePermission(
    env,
    auth,
    "planejamento",
    "edicao"
  );
  if (permissionError) return permissionError;
  if (nextStatus === "CANCELADO") {
    const cancelPermission = await requirePermission(
      env,
      auth,
      "planejamento",
      "exclusao"
    );
    if (cancelPermission) return cancelPermission;
  }
  const placeholders = ids.map(() => "?").join(", ");
  const existingRows = await env.DB.prepare(
    `SELECT * FROM tb_order_service WHERE company_id = ? AND id IN (${placeholders})`
  ).bind(auth.company_id, ...ids).all();
  if (existingRows.results.length !== ids.length) {
    return Response.json({ error: "OS invalidas." }, { status: 400 });
  }
  let updated = 0;
  for (const existing of existingRows.results) {
    const updates = [];
    const values = [];
    let changed = false;
    if (nextStatus && existing.os_status !== nextStatus) {
      updates.push("os_status = ?");
      values.push(nextStatus);
      changed = true;
    }
    if (nextTipo && existing.os_tipo !== nextTipo) {
      updates.push("os_tipo = ?");
      values.push(nextTipo);
      changed = true;
    }
    if (!changed) continue;
    updates.push("updated_at = datetime('now')");
    updates.push("updated_by = ?");
    values.push(auth.user_id);
    await env.DB.prepare(
      `UPDATE tb_order_service SET ${updates.join(", ")} WHERE id = ? AND company_id = ?`
    ).bind(...values, existing.id, auth.company_id).run();
    const afterData = {
      ...existing,
      os_status: nextStatus ?? existing.os_status,
      os_tipo: nextTipo ?? existing.os_tipo
    };
    await logOrderServiceHistory(env, {
      companyId: auth.company_id,
      orderServiceId: existing.id,
      action: "atualizado",
      beforeData: JSON.stringify(existing),
      afterData: JSON.stringify(afterData),
      changedByUserId: auth.user_id,
      changedByName: auth.nome
    });
    updated += 1;
  }
  return Response.json({ updated });
}
__name(handleBulkUpdateOrderService, "handleBulkUpdateOrderService");
async function handleGetSchedulerConfig(request, env) {
  assertJwtSecret(env);
  const auth = await requireAuth(request, env);
  if (!auth) {
    return Response.json({ error: "Token invalido." }, { status: 401 });
  }
  const url = new URL(request.url);
  const mes = String(url.searchParams.get("mes") || "").trim();
  const coordenacao = String(url.searchParams.get("coordenacao") || "").trim();
  const equipeId = String(url.searchParams.get("equipe_id") || "").trim();
  if (!mes || !/^\d{4}-\d{2}$/.test(mes)) {
    return Response.json({ error: "Mes invalido." }, { status: 400 });
  }
  if (!coordenacao || !equipeId) {
    return Response.json(
      { error: "Coordenacao e equipe sao obrigatorias." },
      { status: 400 }
    );
  }
  const subEquipe = String(url.searchParams.get("sub_equipe") || "").trim();
  if (!subEquipe) {
    return Response.json(
      { error: "Sub-equipe obrigatoria." },
      { status: 400 }
    );
  }
  const row = await env.DB.prepare(
    `SELECT id, company_id, coordenacao, equipe_id, sub_equipe, mes, data_json
     FROM tb_os_scheduler_config_v2
     WHERE company_id = ? AND coordenacao = ? AND equipe_id = ? AND sub_equipe = ? AND mes = ?`
  ).bind(auth.company_id, coordenacao, equipeId, subEquipe, mes).first();
  if (!row) {
    return Response.json({ config: null });
  }
  let config = null;
  try {
    config = JSON.parse(row.data_json || "null");
  } catch {
    config = null;
  }
  return Response.json({ config });
}
__name(handleGetSchedulerConfig, "handleGetSchedulerConfig");
async function handleUpsertSchedulerConfig(request, env) {
  assertJwtSecret(env);
  const auth = await requireAuth(request, env);
  if (!auth) {
    return Response.json({ error: "Token invalido." }, { status: 401 });
  }
  const payload = await readJson(request);
  if (!payload) {
    return Response.json({ error: "Dados invalidos." }, { status: 400 });
  }
  const mes = String(payload.mes || "").trim();
  const coordenacao = String(payload.coordenacao || "").trim();
  const equipeId = String(payload.equipe_id || "").trim();
  const subEquipe = String(payload.sub_equipe || "").trim();
  const config = payload.config;
  if (!mes || !/^\d{4}-\d{2}$/.test(mes)) {
    return Response.json({ error: "Mes invalido." }, { status: 400 });
  }
  if (!coordenacao || !equipeId || !subEquipe) {
    return Response.json(
      { error: "Coordenacao, equipe e sub-equipe sao obrigatorias." },
      { status: 400 }
    );
  }
  if (!config || typeof config !== "object") {
    return Response.json({ error: "Configuracao invalida." }, { status: 400 });
  }
  const dataJson = JSON.stringify(config);
  const existing = await env.DB.prepare(
    `SELECT id FROM tb_os_scheduler_config_v2
     WHERE company_id = ? AND coordenacao = ? AND equipe_id = ? AND sub_equipe = ? AND mes = ?`
  ).bind(auth.company_id, coordenacao, equipeId, subEquipe, mes).first();
  if (existing?.id) {
    await env.DB.prepare(
      `UPDATE tb_os_scheduler_config_v2
       SET data_json = ?, updated_at = datetime('now')
       WHERE id = ? AND company_id = ?`
    ).bind(dataJson, existing.id, auth.company_id).run();
  } else {
    const id = crypto.randomUUID();
    await env.DB.prepare(
      `INSERT INTO tb_os_scheduler_config_v2 (
         id,
         company_id,
         coordenacao,
         equipe_id,
         sub_equipe,
         mes,
         data_json,
         created_at,
         updated_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`
    ).bind(
      id,
      auth.company_id,
      coordenacao,
      equipeId,
      subEquipe,
      mes,
      dataJson
    ).run();
  }
  return Response.json({ ok: true });
}
__name(handleUpsertSchedulerConfig, "handleUpsertSchedulerConfig");
async function handleGetSchedulerTeamConfig(request, env) {
  assertJwtSecret(env);
  const auth = await requireAuth(request, env);
  if (!auth) {
    return Response.json({ error: "Token invalido." }, { status: 401 });
  }
  const url = new URL(request.url);
  const coordenacao = url.searchParams.get("coordenacao");
  const conditions = ["company_id = ?"];
  const values = [auth.company_id];
  if (coordenacao) {
    conditions.push("coordenacao = ?");
    values.push(coordenacao);
  }
  const result = await env.DB.prepare(
    `SELECT id, company_id, coordenacao, equipe, escala, observacao, created_at, updated_at
     FROM tb_os_scheduler_team_config
     WHERE ${conditions.join(" AND ")}
     ORDER BY coordenacao, equipe`
  ).bind(...values).all();
  return Response.json({ configs: result.results });
}
__name(handleGetSchedulerTeamConfig, "handleGetSchedulerTeamConfig");
async function handleUpsertSchedulerTeamConfig(request, env) {
  assertJwtSecret(env);
  const auth = await requireAuth(request, env);
  if (!auth) {
    return Response.json({ error: "Token invalido." }, { status: 401 });
  }
  const payload = await readJson(request);
  if (!payload) {
    return Response.json({ error: "Dados invalidos." }, { status: 400 });
  }
  const coordenacao = String(payload.coordenacao || "").trim();
  const equipe = String(payload.equipe || "").trim();
  const escala = normalizeEscala(String(payload.escala || ""));
  const observacao = payload.observacao !== void 0 && payload.observacao !== null ? String(payload.observacao).trim() : null;
  if (!coordenacao || !equipe || !escala) {
    return Response.json(
      { error: "Coordenacao, equipe e escala sao obrigatorias." },
      { status: 400 }
    );
  }
  const existing = await env.DB.prepare(
    `SELECT id FROM tb_os_scheduler_team_config
     WHERE company_id = ? AND coordenacao = ? AND equipe = ?`
  ).bind(auth.company_id, coordenacao, equipe).first();
  if (existing?.id) {
    await env.DB.prepare(
      `UPDATE tb_os_scheduler_team_config
       SET escala = ?, observacao = ?, updated_at = datetime('now')
       WHERE id = ? AND company_id = ?`
    ).bind(escala, observacao, existing.id, auth.company_id).run();
  } else {
    const id = crypto.randomUUID();
    await env.DB.prepare(
      `INSERT INTO tb_os_scheduler_team_config (
         id,
         company_id,
         coordenacao,
         equipe,
         escala,
         observacao,
         created_at,
         updated_at
       ) VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`
    ).bind(id, auth.company_id, coordenacao, equipe, escala, observacao).run();
  }
  return Response.json({ ok: true });
}
__name(handleUpsertSchedulerTeamConfig, "handleUpsertSchedulerTeamConfig");
async function handleGetSchedulerSubTeamConfig(request, env) {
  assertJwtSecret(env);
  const auth = await requireAuth(request, env);
  if (!auth) {
    return Response.json({ error: "Token invalido." }, { status: 401 });
  }
  const url = new URL(request.url);
  const coordenacao = url.searchParams.get("coordenacao");
  const equipeId = url.searchParams.get("equipe_id");
  const conditions = ["company_id = ?"];
  const values = [auth.company_id];
  if (coordenacao) {
    conditions.push("coordenacao = ?");
    values.push(coordenacao);
  }
  if (equipeId) {
    conditions.push("equipe_id = ?");
    values.push(equipeId);
  }
  const result = await env.DB.prepare(
    `SELECT id, company_id, coordenacao, equipe_id, sub_equipe, escala, status, observacao, created_at, updated_at
     FROM tb_os_scheduler_sub_team
     WHERE ${conditions.join(" AND ")}
     ORDER BY coordenacao, equipe_id, sub_equipe`
  ).bind(...values).all();
  return Response.json({ configs: result.results });
}
__name(handleGetSchedulerSubTeamConfig, "handleGetSchedulerSubTeamConfig");
async function handleUpsertSchedulerSubTeamConfig(request, env) {
  assertJwtSecret(env);
  const auth = await requireAuth(request, env);
  if (!auth) {
    return Response.json({ error: "Token invalido." }, { status: 401 });
  }
  const payload = await readJson(request);
  if (!payload) {
    return Response.json({ error: "Dados invalidos." }, { status: 400 });
  }
  const coordenacao = String(payload.coordenacao || "").trim();
  const equipeId = String(payload.equipe_id || "").trim();
  const subEquipe = String(payload.sub_equipe || "").trim();
  const escala = normalizeEscala(String(payload.escala || ""));
  const status = normalizeStatus(String(payload.status || "ativo"));
  const observacao = payload.observacao !== void 0 && payload.observacao !== null ? String(payload.observacao).trim() : null;
  if (!coordenacao || !equipeId || !subEquipe || !escala || !status) {
    return Response.json(
      { error: "Coordenacao, equipe, sub-equipe e escala sao obrigatorias." },
      { status: 400 }
    );
  }
  const estrutura = await env.DB.prepare(
    `SELECT id, coordenacao FROM tb_estrutura
     WHERE id = ? AND company_id = ?`
  ).bind(equipeId, auth.company_id).first();
  if (!estrutura || estrutura.coordenacao !== coordenacao) {
    return Response.json({ error: "Equipe invalida." }, { status: 400 });
  }
  const existing = await env.DB.prepare(
    `SELECT id FROM tb_os_scheduler_sub_team
     WHERE company_id = ? AND coordenacao = ? AND equipe_id = ? AND sub_equipe = ?`
  ).bind(auth.company_id, coordenacao, equipeId, subEquipe).first();
  try {
    if (existing?.id) {
      await env.DB.prepare(
        `UPDATE tb_os_scheduler_sub_team
         SET escala = ?, status = ?, observacao = ?, updated_at = datetime('now')
         WHERE id = ? AND company_id = ?`
      ).bind(escala, status, observacao, existing.id, auth.company_id).run();
    } else {
      const id = crypto.randomUUID();
      await env.DB.prepare(
        `INSERT INTO tb_os_scheduler_sub_team (
           id,
           company_id,
           coordenacao,
           equipe_id,
           sub_equipe,
           escala,
           status,
           observacao,
           created_at,
           updated_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`
      ).bind(
        id,
        auth.company_id,
        coordenacao,
        equipeId,
        subEquipe,
        escala,
        status,
        observacao
      ).run();
    }
  } catch (error) {
    console.error("scheduler-sub-team save failed", error);
    return Response.json({ error: "Falha ao salvar sub-equipe." }, { status: 400 });
  }
  return Response.json({ ok: true });
}
__name(handleUpsertSchedulerSubTeamConfig, "handleUpsertSchedulerSubTeamConfig");
async function handleDeleteSchedulerSubTeamConfig(request, env) {
  assertJwtSecret(env);
  const auth = await requireAuth(request, env);
  if (!auth) {
    return Response.json({ error: "Token invalido." }, { status: 401 });
  }
  const url = new URL(request.url);
  const coordenacao = String(url.searchParams.get("coordenacao") || "").trim();
  const equipeId = String(url.searchParams.get("equipe_id") || "").trim();
  const subEquipe = String(url.searchParams.get("sub_equipe") || "").trim();
  if (!coordenacao || !equipeId || !subEquipe) {
    return Response.json(
      { error: "Coordenacao, equipe e sub-equipe sao obrigatorias." },
      { status: 400 }
    );
  }
  await env.DB.prepare(
    `DELETE FROM tb_os_scheduler_sub_team
     WHERE company_id = ? AND coordenacao = ? AND equipe_id = ? AND sub_equipe = ?`
  ).bind(auth.company_id, coordenacao, equipeId, subEquipe).run();
  return Response.json({ ok: true });
}
__name(handleDeleteSchedulerSubTeamConfig, "handleDeleteSchedulerSubTeamConfig");
async function handleGetSchedulerAssignments(request, env) {
  assertJwtSecret(env);
  const auth = await requireAuth(request, env);
  if (!auth) {
    return Response.json({ error: "Token invalido." }, { status: 401 });
  }
  const url = new URL(request.url);
  const coordenacao = url.searchParams.get("coordenacao");
  const equipeId = url.searchParams.get("equipe_id");
  const subEquipe = url.searchParams.get("sub_equipe");
  const conditions = ["company_id = ?"];
  const values = [auth.company_id];
  if (coordenacao) {
    conditions.push("coordenacao = ?");
    values.push(coordenacao);
  }
  if (equipeId) {
    conditions.push("equipe_id = ?");
    values.push(equipeId);
  }
  if (subEquipe) {
    conditions.push("sub_equipe = ?");
    values.push(subEquipe);
  }
  const result = await env.DB.prepare(
    `SELECT id, company_id, os_id, coordenacao, equipe_id, sub_equipe, created_at, updated_at
     FROM tb_os_scheduler_assignment
     WHERE ${conditions.join(" AND ")}`
  ).bind(...values).all();
  return Response.json({ assignments: result.results });
}
__name(handleGetSchedulerAssignments, "handleGetSchedulerAssignments");
async function handleUpsertSchedulerAssignment(request, env) {
  assertJwtSecret(env);
  const auth = await requireAuth(request, env);
  if (!auth) {
    return Response.json({ error: "Token invalido." }, { status: 401 });
  }
  const payload = await readJson(request);
  if (!payload) {
    return Response.json({ error: "Dados invalidos." }, { status: 400 });
  }
  const osId = String(payload.os_id || "").trim();
  const coordenacao = String(payload.coordenacao || "").trim();
  const equipeId = String(payload.equipe_id || "").trim();
  const subEquipe = String(payload.sub_equipe || "").trim();
  if (!osId || !coordenacao || !equipeId || !subEquipe) {
    return Response.json(
      { error: "OS, coordenacao, equipe e sub-equipe sao obrigatorias." },
      { status: 400 }
    );
  }
  const os = await env.DB.prepare(
    `SELECT id, os_status, os_programado1, os_realizado_em
     FROM tb_order_service
     WHERE id = ? AND company_id = ?`
  ).bind(osId, auth.company_id).first();
  if (!os) {
    return Response.json({ error: "OS nao encontrada." }, { status: 404 });
  }
  const estrutura = await env.DB.prepare(
    `SELECT id, coordenacao FROM tb_estrutura WHERE id = ? AND company_id = ?`
  ).bind(equipeId, auth.company_id).first();
  if (!estrutura || estrutura.coordenacao !== coordenacao) {
    return Response.json({ error: "Equipe invalida." }, { status: 400 });
  }
  const existing = await env.DB.prepare(
    `SELECT id, coordenacao, equipe_id, sub_equipe
     FROM tb_os_scheduler_assignment
     WHERE company_id = ? AND os_id = ?`
  ).bind(auth.company_id, osId).first();
  const todayKey = getLocalDateKey();
  const programado1 = normalizeDateOnly(os.os_programado1);
  const isOverdueWeek1 = os.os_status === "PROGRAMADO" && !os.os_realizado_em && Boolean(programado1) && (programado1 || "") < todayKey;
  if (existing) {
    if (existing.equipe_id === equipeId && existing.sub_equipe === subEquipe) {
      return Response.json({ ok: true, id: existing.id });
    }
    if (os.os_status !== "CRIADO" && !isOverdueWeek1) {
      return Response.json(
        { error: "OS ja esta alocada em outra equipe." },
        { status: 409 }
      );
    }
    await env.DB.prepare(
      `UPDATE tb_os_scheduler_assignment
       SET coordenacao = ?, equipe_id = ?, sub_equipe = ?, updated_at = datetime('now')
       WHERE id = ? AND company_id = ?`
    ).bind(coordenacao, equipeId, subEquipe, existing.id, auth.company_id).run();
    return Response.json({ ok: true, id: existing.id });
  }
  const id = crypto.randomUUID();
  await env.DB.prepare(
    `INSERT INTO tb_os_scheduler_assignment (
       id,
       company_id,
       os_id,
       coordenacao,
       equipe_id,
       sub_equipe,
       created_at,
       updated_at
     ) VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`
  ).bind(id, auth.company_id, osId, coordenacao, equipeId, subEquipe).run();
  return Response.json({ ok: true, id });
}
__name(handleUpsertSchedulerAssignment, "handleUpsertSchedulerAssignment");
async function handleDeleteSchedulerAssignment(request, env) {
  assertJwtSecret(env);
  const auth = await requireAuth(request, env);
  if (!auth) {
    return Response.json({ error: "Token invalido." }, { status: 401 });
  }
  const url = new URL(request.url);
  const osId = String(url.searchParams.get("os_id") || "").trim();
  if (!osId) {
    return Response.json({ error: "os_id obrigatorio." }, { status: 400 });
  }
  await env.DB.prepare(
    `DELETE FROM tb_os_scheduler_assignment
     WHERE company_id = ? AND os_id = ?`
  ).bind(auth.company_id, osId).run();
  return Response.json({ ok: true });
}
__name(handleDeleteSchedulerAssignment, "handleDeleteSchedulerAssignment");
async function handleGetSchedulerHolidays(request, env) {
  assertJwtSecret(env);
  const auth = await requireAuth(request, env);
  if (!auth) {
    return Response.json({ error: "Token invalido." }, { status: 401 });
  }
  const url = new URL(request.url);
  const equipeId = url.searchParams.get("equipe_id");
  const conditions = ["company_id = ?"];
  const values = [auth.company_id];
  if (equipeId) {
    conditions.push("equipe_id = ?");
    values.push(equipeId);
  }
  const result = await env.DB.prepare(
    `SELECT id, company_id, equipe_id, feriado, data, created_at, updated_at
     FROM tb_os_scheduler_holiday
     WHERE ${conditions.join(" AND ")}
     ORDER BY data, feriado`
  ).bind(...values).all();
  return Response.json({ holidays: result.results });
}
__name(handleGetSchedulerHolidays, "handleGetSchedulerHolidays");
async function handleUpsertSchedulerHoliday(request, env) {
  assertJwtSecret(env);
  const auth = await requireAuth(request, env);
  if (!auth) {
    return Response.json({ error: "Token invalido." }, { status: 401 });
  }
  const payload = await readJson(request);
  if (!payload) {
    return Response.json({ error: "Dados invalidos." }, { status: 400 });
  }
  const id = payload.id ? String(payload.id).trim() : "";
  const feriado = String(payload.feriado || "").trim();
  const data = String(payload.data || "").trim();
  if (!feriado || !data) {
    return Response.json(
      { error: "Feriado e data sao obrigatorios." },
      { status: 400 }
    );
  }
  if (id) {
    const equipeId = String(payload.equipe_id || "").trim();
    if (!equipeId) {
      return Response.json({ error: "Equipe obrigatoria." }, { status: 400 });
    }
    const estrutura = await env.DB.prepare(
      `SELECT id FROM tb_estrutura WHERE id = ? AND company_id = ?`
    ).bind(equipeId, auth.company_id).first();
    if (!estrutura) {
      return Response.json({ error: "Equipe invalida." }, { status: 400 });
    }
    await env.DB.prepare(
      `UPDATE tb_os_scheduler_holiday
       SET equipe_id = ?, feriado = ?, data = ?, updated_at = datetime('now')
       WHERE id = ? AND company_id = ?`
    ).bind(equipeId, feriado, data, id, auth.company_id).run();
    return Response.json({ ok: true });
  }
  const allEquipes = Boolean(payload.all_equipes);
  let equipeIds = Array.isArray(payload.equipe_ids) ? payload.equipe_ids.map((value) => String(value).trim()).filter(Boolean) : [];
  if (allEquipes) {
    const result = await env.DB.prepare(
      `SELECT id FROM tb_estrutura
       WHERE company_id = ? AND status = 'ativo' AND execucao = 'sim'`
    ).bind(auth.company_id).all();
    equipeIds = result.results.map((row) => row.id);
  }
  if (!equipeIds.length) {
    return Response.json(
      { error: "Selecione ao menos uma equipe." },
      { status: 400 }
    );
  }
  const createdAt = await env.DB.prepare(`SELECT datetime('now') AS now`).first();
  const now = createdAt?.now || (/* @__PURE__ */ new Date()).toISOString();
  const insertStmt = env.DB.prepare(
    `INSERT INTO tb_os_scheduler_holiday (
       id,
       company_id,
       equipe_id,
       feriado,
       data,
       created_at,
       updated_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?)`
  );
  for (const equipeId of equipeIds) {
    const estrutura = await env.DB.prepare(
      `SELECT id FROM tb_estrutura WHERE id = ? AND company_id = ?`
    ).bind(equipeId, auth.company_id).first();
    if (!estrutura) {
      continue;
    }
    const newId = crypto.randomUUID();
    await insertStmt.bind(newId, auth.company_id, equipeId, feriado, data, now, now).run();
  }
  return Response.json({ ok: true });
}
__name(handleUpsertSchedulerHoliday, "handleUpsertSchedulerHoliday");
async function handleOrderServiceHistory(request, env) {
  assertJwtSecret(env);
  const auth = await requireAuth(request, env);
  if (!auth) {
    return Response.json({ error: "Token invalido." }, { status: 401 });
  }
  const url = new URL(request.url);
  const osId = url.searchParams.get("os_id");
  if (!osId) {
    return Response.json({ error: "os_id obrigatorio." }, { status: 400 });
  }
  const result = await env.DB.prepare(
    `SELECT id, company_id, order_service_id, action, before_data, after_data, changed_by_user_id, changed_by_name, created_at
     FROM tb_order_service_history
     WHERE company_id = ? AND order_service_id = ?
     ORDER BY created_at DESC`
  ).bind(auth.company_id, osId).all();
  return Response.json({ history: result.results });
}
__name(handleOrderServiceHistory, "handleOrderServiceHistory");
async function insertProfilePermissions(env, profileId, permissions) {
  for (const item of permissions) {
    const screenId = String(item.screen_id || "").trim();
    if (!screenId) continue;
    const leitura = item.leitura ? 1 : 0;
    const criacao = item.criacao ? 1 : 0;
    const edicao = item.edicao ? 1 : 0;
    const exclusao = item.exclusao ? 1 : 0;
    await env.DB.prepare(
      `INSERT INTO tb_profile_permission (profile_id, screen_id, leitura, criacao, edicao, exclusao)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).bind(profileId, screenId, leitura, criacao, edicao, exclusao).run();
  }
}
__name(insertProfilePermissions, "insertProfilePermissions");
async function revokeActiveSessionsForUser(env, userId, companyId) {
  const now = (/* @__PURE__ */ new Date()).toISOString();
  await env.DB.prepare(
    `UPDATE tb_user_session
     SET revoked_at = ?
     WHERE company_id = ? AND user_id = ? AND revoked_at IS NULL`
  ).bind(now, companyId, userId).run();
}
__name(revokeActiveSessionsForUser, "revokeActiveSessionsForUser");
async function revokeSession(env, sessionId, companyId, userId) {
  const now = (/* @__PURE__ */ new Date()).toISOString();
  await env.DB.prepare(
    `UPDATE tb_user_session
     SET revoked_at = ?
     WHERE id = ? AND company_id = ? AND user_id = ? AND revoked_at IS NULL`
  ).bind(now, sessionId, companyId, userId).run();
}
__name(revokeSession, "revokeSession");
async function createUserSession(env, companyId, userId, ip) {
  const id = crypto.randomUUID();
  const now = (/* @__PURE__ */ new Date()).toISOString();
  await env.DB.prepare(
    `INSERT INTO tb_user_session (id, company_id, user_id, ip, created_at)
     VALUES (?, ?, ?, ?, ?)`
  ).bind(id, companyId, userId, ip, now).run();
  return id;
}
__name(createUserSession, "createUserSession");
async function getSessionById(env, sessionId, companyId, userId) {
  return env.DB.prepare(
    `SELECT id, company_id, user_id, ip, created_at, revoked_at
       FROM tb_user_session
       WHERE id = ? AND company_id = ? AND user_id = ?`
  ).bind(sessionId, companyId, userId).first();
}
__name(getSessionById, "getSessionById");
async function requireAuth(request, env) {
  const header = request.headers.get("authorization") || "";
  let token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!token) {
    token = getTokenFromCookie(request) || "";
  }
  if (!token) return null;
  const payload = await verifyJwt(token, env.JWT_SECRET);
  if (!payload) return null;
  if (!payload.session_id) return null;
  const session = await getSessionById(
    env,
    payload.session_id,
    payload.company_id,
    payload.user_id
  );
  if (!session || session.revoked_at) {
    return null;
  }
  const requestIp = getClientIp(request);
  if (session.ip && requestIp && session.ip !== requestIp) {
    return null;
  }
  const nowSeconds = Math.floor(Date.now() / 1e3);
  const refreshThresholdSeconds = SESSION_REFRESH_THRESHOLD_MINUTES * 60;
  if (payload.exp - nowSeconds <= refreshThresholdSeconds) {
    const expiresMinutes = parseInt(env.JWT_EXP_MINUTES || "", 10) || DEFAULT_JWT_EXP_MINUTES;
    const refreshToken = await signJwt(
      {
        user_id: payload.user_id,
        company_id: payload.company_id,
        nome: payload.nome,
        cargo: payload.cargo,
        equipe: payload.equipe,
        session_id: payload.session_id
      },
      env.JWT_SECRET,
      expiresMinutes
    );
    scheduleSessionRefresh(request, refreshToken, expiresMinutes * 60);
  }
  return payload;
}
__name(requireAuth, "requireAuth");
async function requirePermission(env, auth, screenId, action) {
  const row = await env.DB.prepare(
    `SELECT p.status AS profile_status,
            perm.leitura AS leitura,
            perm.criacao AS criacao,
            perm.edicao AS edicao,
            perm.exclusao AS exclusao
     FROM tb_user u
     LEFT JOIN tb_profile p ON p.id = u.profile_id
     LEFT JOIN tb_profile_permission perm
       ON perm.profile_id = u.profile_id AND perm.screen_id = ?
     WHERE u.id = ? AND u.company_id = ?`
  ).bind(screenId, auth.user_id, auth.company_id).first();
  if (!row || row.profile_status !== "ativo") {
    return Response.json({ error: "Acesso negado." }, { status: 403 });
  }
  const allowed = action === "leitura" ? row.leitura === 1 : action === "criacao" ? row.criacao === 1 : action === "edicao" ? row.edicao === 1 : row.exclusao === 1;
  if (!allowed) {
    return Response.json({ error: "Acesso negado." }, { status: 403 });
  }
  return null;
}
__name(requirePermission, "requirePermission");
async function signJwt(data, secret, expiresInMinutes) {
  const header = { alg: "HS256", typ: "JWT" };
  const exp = Math.floor(Date.now() / 1e3) + expiresInMinutes * 60;
  const payload = { ...data, exp };
  const headerB64 = base64UrlEncode(JSON.stringify(header));
  const payloadB64 = base64UrlEncode(JSON.stringify(payload));
  const signature = await hmacSha256(`${headerB64}.${payloadB64}`, secret);
  return `${headerB64}.${payloadB64}.${signature}`;
}
__name(signJwt, "signJwt");
async function verifyJwt(token, secret) {
  const [headerB64, payloadB64, signature] = token.split(".");
  if (!headerB64 || !payloadB64 || !signature) return null;
  const expected = await hmacSha256(`${headerB64}.${payloadB64}`, secret);
  if (!timingSafeEqual(signature, expected)) return null;
  const payload = decodeBase64Url(payloadB64);
  if (!payload || typeof payload.exp !== "number") return null;
  if (payload.exp <= Math.floor(Date.now() / 1e3)) return null;
  return payload;
}
__name(verifyJwt, "verifyJwt");
async function hmacSha256(value, secret) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return base64UrlEncode(new Uint8Array(signature));
}
__name(hmacSha256, "hmacSha256");
function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i += 1) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}
__name(timingSafeEqual, "timingSafeEqual");
function base64UrlEncode(input) {
  const bytes = typeof input === "string" ? new TextEncoder().encode(input) : input;
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}
__name(base64UrlEncode, "base64UrlEncode");
function decodeBase64Url(value) {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/");
  const padLength = (4 - padded.length % 4) % 4;
  const base64 = padded + "=".repeat(padLength);
  try {
    const decoded = atob(base64);
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}
__name(decodeBase64Url, "decodeBase64Url");
function assertJwtSecret(env) {
  if (!env.JWT_SECRET) {
    throw new Error("JWT_SECRET is required as an environment variable");
  }
}
__name(assertJwtSecret, "assertJwtSecret");
function normalizeStatus(value) {
  if (value === "ativo" || value === "inativo" || value === "excluido") {
    return value;
  }
  return null;
}
__name(normalizeStatus, "normalizeStatus");
function normalizeProfileStatus(value) {
  const normalized = normalizeStatus(value);
  if (normalized === "excluido") {
    return null;
  }
  return normalized;
}
__name(normalizeProfileStatus, "normalizeProfileStatus");
function normalizeEscala(value) {
  const normalized = String(value ?? "").trim().toUpperCase();
  if (normalized === "ADM") return "ADM";
  if (normalized === "6X2") return "6x2";
  return null;
}
__name(normalizeEscala, "normalizeEscala");
function normalizeAtivoField(value) {
  return String(value ?? "").trim();
}
__name(normalizeAtivoField, "normalizeAtivoField");
function normalizeOsTipo(value) {
  const normalized = String(value ?? "").trim().toUpperCase();
  if (normalized === "PDM" || normalized === "EX" || normalized === "RI") {
    return normalized;
  }
  return null;
}
__name(normalizeOsTipo, "normalizeOsTipo");
function normalizeOsStatus(value) {
  const normalized = String(value ?? "").trim().toUpperCase();
  if (normalized === "CRIADO" || normalized === "PROGRAMADO" || normalized === "REALIZADO" || normalized === "CANCELADO") {
    return normalized;
  }
  return null;
}
__name(normalizeOsStatus, "normalizeOsStatus");
function normalizeFlag(value) {
  if (value === 0 || value === "0" || value === false) return 0;
  if (value === 1 || value === "1" || value === true) return 1;
  return null;
}
__name(normalizeFlag, "normalizeFlag");
function normalizeDateOnly(value) {
  if (!value) return null;
  const trimmed = String(value).trim();
  if (!trimmed) return null;
  const datePart = trimmed.split("T")[0].split(" ")[0];
  return datePart || null;
}
__name(normalizeDateOnly, "normalizeDateOnly");
function getLocalDateKey() {
  const now = /* @__PURE__ */ new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
__name(getLocalDateKey, "getLocalDateKey");
function isPasswordValid(value) {
  if (value.length < 7) return false;
  const hasLetter = /[A-Za-z]/.test(value);
  const hasNumber = /[0-9]/.test(value);
  const hasSpecial = /[!@#$%&]/.test(value);
  return hasLetter && hasNumber && hasSpecial;
}
__name(isPasswordValid, "isPasswordValid");
function isValidCs(value) {
  return /^[0-9]{6}$/.test(value);
}
__name(isValidCs, "isValidCs");
function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}
__name(isValidEmail, "isValidEmail");
async function readJson(request) {
  try {
    if (!request.body) return null;
    return await request.json();
  } catch {
    return null;
  }
}
__name(readJson, "readJson");
function parseBooleanFlag(value) {
  if (value === void 0 || value === null) return null;
  if (typeof value === "boolean") return value ? 1 : 0;
  const normalized = String(value).trim().toLowerCase();
  if (normalized === "1" || normalized === "true") return 1;
  if (normalized === "0" || normalized === "false") return 0;
  return null;
}
__name(parseBooleanFlag, "parseBooleanFlag");
function parseNullableNumber(value) {
  if (value === void 0 || value === null) return null;
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }
  const normalized = String(value).trim();
  if (!normalized) return null;
  const parsed = Number(normalized);
  if (Number.isNaN(parsed)) return null;
  return parsed;
}
__name(parseNullableNumber, "parseNullableNumber");
async function logLoginAttempt(env, input) {
  await env.DB.prepare(
    "INSERT INTO tb_login_log (id, company_id, user_id, cs, email, ip, user_agent, success, reason) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
  ).bind(
    crypto.randomUUID(),
    input.companyId ?? null,
    input.userId ?? null,
    input.cs ?? null,
    input.email ?? null,
    input.ip ?? null,
    input.userAgent ?? null,
    input.success,
    input.reason
  ).run();
}
__name(logLoginAttempt, "logLoginAttempt");
async function logUserHistory(env, input) {
  await env.DB.prepare(
    "INSERT INTO tb_user_history (id, company_id, user_id, changed_by_user_id, changed_by_name, changes) VALUES (?, ?, ?, ?, ?, ?)"
  ).bind(
    crypto.randomUUID(),
    input.companyId,
    input.userId,
    input.changedByUserId,
    input.changedByName,
    input.changes
  ).run();
}
__name(logUserHistory, "logUserHistory");
async function logProfileHistory(env, input) {
  await env.DB.prepare(
    "INSERT INTO tb_profile_history (id, company_id, profile_id, changed_by_user_id, changed_by_name, changes) VALUES (?, ?, ?, ?, ?, ?)"
  ).bind(
    crypto.randomUUID(),
    input.companyId,
    input.profileId,
    input.changedByUserId,
    input.changedByName,
    input.changes
  ).run();
}
__name(logProfileHistory, "logProfileHistory");
async function logEstruturaHistory(env, input) {
  await env.DB.prepare(
    "INSERT INTO tb_estrutura_history (id, company_id, estrutura_id, action, before_data, after_data, changed_by_user_id, changed_by_name) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
  ).bind(
    crypto.randomUUID(),
    input.companyId,
    input.estruturaId,
    input.action,
    input.beforeData,
    input.afterData,
    input.changedByUserId,
    input.changedByName
  ).run();
}
__name(logEstruturaHistory, "logEstruturaHistory");
async function logAtivoHistory(env, input) {
  await env.DB.prepare(
    "INSERT INTO tb_ativo_history (id, company_id, ativo_id, action, before_data, after_data, changed_by_user_id, changed_by_name) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
  ).bind(
    crypto.randomUUID(),
    input.companyId,
    input.ativoId,
    input.action,
    input.beforeData,
    input.afterData,
    input.changedByUserId,
    input.changedByName
  ).run();
}
__name(logAtivoHistory, "logAtivoHistory");
async function logAtivoStatusChange(env, input) {
  await env.DB.prepare(
    `INSERT INTO tb_ativo_status_log (
        id,
        company_id,
        ativo_id,
        ativo_codpe,
        ativo_descritivo,
        equipe,
        status,
        observacao,
        data_alteracao,
        data_previsao_reparo,
        changed_by_user_id,
        changed_by_name
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    crypto.randomUUID(),
    input.companyId,
    input.ativoId,
    input.ativoCodpe,
    input.ativoDescritivo,
    input.equipe,
    input.status,
    input.observacao,
    input.dataAlteracao,
    input.dataPrevisaoReparo,
    input.changedByUserId,
    input.changedByName
  ).run();
}
__name(logAtivoStatusChange, "logAtivoStatusChange");
async function logOrderServiceHistory(env, input) {
  await env.DB.prepare(
    "INSERT INTO tb_order_service_history (id, company_id, order_service_id, action, before_data, after_data, changed_by_user_id, changed_by_name) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
  ).bind(
    crypto.randomUUID(),
    input.companyId,
    input.orderServiceId,
    input.action,
    input.beforeData,
    input.afterData,
    input.changedByUserId,
    input.changedByName
  ).run();
}
__name(logOrderServiceHistory, "logOrderServiceHistory");
function getClientIp(request) {
  return request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for") || null;
}
__name(getClientIp, "getClientIp");
function getTokenFromCookie(request) {
  const raw = request.headers.get("cookie") || "";
  if (!raw) return null;
  const search = `${SESSION_COOKIE_NAME}=`;
  const parts = raw.split(";");
  for (const part of parts) {
    const trimmed = part.trim();
    if (trimmed.startsWith(search)) {
      return trimmed.slice(search.length);
    }
  }
  return null;
}
__name(getTokenFromCookie, "getTokenFromCookie");
function isSecureRequest(request) {
  const forwardedProto = request.headers.get("x-forwarded-proto");
  if (forwardedProto) {
    return forwardedProto.toLowerCase().includes("https");
  }
  const protocol = new URL(request.url).protocol;
  return protocol === "https:";
}
__name(isSecureRequest, "isSecureRequest");
function buildSessionCookie(value, request, maxAgeSeconds) {
  const secure = isSecureRequest(request);
  const sameSite = secure ? "None" : "Lax";
  const parts = [
    `${SESSION_COOKIE_NAME}=${value}`,
    `Max-Age=${maxAgeSeconds}`,
    "Path=/",
    "HttpOnly",
    `SameSite=${sameSite}`
  ];
  if (secure) {
    parts.push("Secure");
  }
  return parts.join("; ");
}
__name(buildSessionCookie, "buildSessionCookie");
function resolveCorsOrigin(env, request) {
  const explicit = env.CORS_ORIGIN?.trim();
  if (explicit && explicit !== "*") {
    return explicit;
  }
  const requestOrigin = request?.headers.get("origin");
  if (requestOrigin) {
    return requestOrigin;
  }
  return explicit || "*";
}
__name(resolveCorsOrigin, "resolveCorsOrigin");
function withCors(response, env, request) {
  const origin = resolveCorsOrigin(env, request);
  const headers = new Headers(response.headers);
  headers.set("Access-Control-Allow-Origin", origin);
  headers.set("Access-Control-Allow-Methods", "GET,POST,PATCH,DELETE,OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  headers.set("Access-Control-Max-Age", "86400");
  if (origin !== "*") {
    headers.set("Access-Control-Allow-Credentials", "true");
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}
__name(withCors, "withCors");

// node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
init_modules_watch_stub();
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
init_modules_watch_stub();
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-L0oFto/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = src_default;

// node_modules/wrangler/templates/middleware/common.ts
init_modules_watch_stub();
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-L0oFto/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
/*! Bundled license information:

bcryptjs/dist/bcrypt.js:
  (**
   * @license bcrypt.js (c) 2013 Daniel Wirtz <dcode@dcode.io>
   * Released under the Apache License, Version 2.0
   * see: https://github.com/dcodeIO/bcrypt.js for details
   *)
*/
//# sourceMappingURL=index.js.map
