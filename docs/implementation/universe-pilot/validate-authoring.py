"""Check this draft's authoring data, not the application or API implementation.

Run from any directory with Python 3 and Node available. Reads two historical
pure mission modules from the repository object store; never changes a checkout.
"""
from pathlib import Path
from datetime import datetime, timezone
import base64
import hashlib
import json
import math
import re
import subprocess

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
BUNDLE = HERE / "mission-bundle-0.2.0-draft.json"
bundle = json.loads(BUNDLE.read_text(), parse_constant=lambda x: (_ for _ in ()).throw(ValueError(x)))
checks = []


def check(name, condition, detail=None):
    checks.append(dict(name=name, passed=bool(condition), detail=detail))


def digest(value, excluded):
    body = {key: val for key, val in value.items() if key != excluded}
    js = """import {createHash} from 'node:crypto';
let input=''; for await(const chunk of process.stdin) input+=chunk;
function canonical(v) {
 if (Array.isArray(v)) return '['+v.map(canonical).join(',')+']';
 if (v!==null && typeof v==='object') return '{'+Object.keys(v).sort().map(
  key=>JSON.stringify(key)+':'+canonical(v[key])).join(',')+'}';
 return JSON.stringify(v);
}
process.stdout.write(createHash('sha256').update(canonical(JSON.parse(input)), 'utf8').digest('hex'));
"""
    return subprocess.check_output(["node", "--input-type=module", "-e", js],
                                   input=json.dumps(body, ensure_ascii=False, allow_nan=False), text=True).strip()


def near(left, right):
    return math.isclose(left, right, rel_tol=1e-12, abs_tol=1e-8)


def unique(values):
    return len(values) == len(set(values))


datasets = {d["id"]: d for d in bundle["datasets"]}
sources = {s["id"]: s for s in bundle["sources"]}
missions = {m["id"]: m for m in bundle["missions"]}
check("bundle content checksum", digest(bundle, "bundleContentSha256") == bundle["bundleContentSha256"])
check("two stable mission families", set(missions) == {"thalassa-wind-survey", "spacecraft-journey"})
check("unique dataset and source IDs", len(datasets) == 4 and len(sources) == 12)
check("draft and educator gates", bundle["status"] == "draft" and
      bundle["reviewState"]["science"] == "educator-pending" and
      bundle["reviewState"]["curriculum"] == "educator-pending" and
      bundle["reviewState"]["publication"] == "not-authorized")
check("review-only fixture with no grants", bundle["releaseId"].startswith("pilot-fixture-") and
      bundle["policy"]["type"] == "reviewed-only" and bundle["policy"]["grantIds"] == [] and
      bundle["policy"]["productionSubmissionsAllowed"] is False)
check("disabled artifact references", bundle["compatibility"]["artifactReferenceEnabled"] is False)
check("explicit hash encoding and capability kinds", bundle["hashEncoding"].startswith("sorted-key-json-ecmascript-v1:") and
      bundle["compatibility"]["workstationKinds"] == ["mission", "simulation"])
check("cross-serialization number vector", digest({"a": 14160.0, "b": 0.000001}, "none") ==
      hashlib.sha256(b'{"a":14160,"b":0.000001}').hexdigest())
for d in datasets.values():
    check("dataset checksum: " + d["id"], digest(d, "sha256") == d["sha256"])
for m in missions.values():
    check("mission checksum: " + m["id"], digest(m, "contentSha256") == m["contentSha256"])
    check("mission references: " + m["id"], set(m["sourceRefs"]) <= sources.keys() and
          set(m["evidenceRefs"]) <= datasets.keys() and m["completionPolicyRef"] == bundle["policy"]["version"])
    check("new version remains draft: " + m["id"], m["version"] == "0.2.0-draft" and m["status"] == "draft")
    for r in m["routes"]:
        label = m["id"] + "/" + r["id"]
        check("route shape: " + label, unique([s["id"] for s in r["steps"]]) and
              unique([p["partId"] for p in r["requiredParts"]]) and
              len(r["requiredParts"]) <= 8 and set(r["scenarioIds"]) <= datasets.keys() and
              set(r["supportModes"]) == {"guided", "independent"})
        check("required alternatives: " + label, all(p["anyOfKinds"] and
              set(p["anyOfKinds"]) <= {"text", "table", "diagram", "choice"} and
              ("diagram" not in p["anyOfKinds"] or "text" in p["anyOfKinds"])
              for p in r["requiredParts"]))
        check("alignment references: " + label, all(set(a["sourceRefs"]) <= sources.keys()
              for a in r["alignment"]))
        partids = {p["partId"] for p in r["requiredParts"]}
        check("every step maps to authored evidence: " + label, all(s["evidencePartIds"] and
              set(s["evidencePartIds"]) <= partids for s in r["steps"]) and
              set().union(*(set(s["evidencePartIds"]) for s in r["steps"])) == partids)
        check("concrete support content: " + label, r["workedExample"]["steps"] and
              r["workedExample"]["practiceStepId"] in {s["id"] for s in r["steps"]} and
              set(r["supportPresentation"]) == {"guided", "independent"} and
              all(len(s.get("hints", [])) >= 2 and s.get("solution") for s in r["steps"] if s["kind"] in ["number", "choose"]))
        for pid, t in r["tableTemplates"].items():
            check("authored table template: " + label + "/" + pid, pid in partids and
                  1 <= len(t["columns"]) <= 8 and len(t["rows"]) <= 30 and
                  all(len(row["cells"]) == len(t["columns"]) and
                      all(isinstance(c["value"], str) and len(c["value"]) <= 200 and isinstance(c["editable"], bool) for c in row["cells"])
                      for row in t["rows"]) and bool(t["textStarter"]))
        for pid, t in r.get("diagramTemplates", {}).items():
            ids = {n["id"] for n in t["nodeVocabulary"]}
            check("authored diagram vocabulary: " + label + "/" + pid, pid in partids and
                  len(ids) == len(t["nodeVocabulary"]) <= 12 and len(t["edgeVocabulary"]) <= 20 and
                  all(e["fromId"] in ids and e["toId"] in ids for e in t["edgeVocabulary"]) and
                  all(len(n["label"]) <= 120 for n in t["nodeVocabulary"]) and bool(t["textStarter"]))
        check("all required parts have a starter or choice: " + label, partids <=
              (r["tableTemplates"].keys() | r.get("diagramTemplates", {}).keys() |
               r["sentenceStarters"].keys() | r.get("choiceLabels", {}).keys()))
        for pid, options in r.get("choiceLabels", {}).items():
            check("authored choice labels: " + label + "/" + pid,
                  {o["id"] for o in options} == set(r["choiceOptions"][pid]) and all(o["label"] for o in options))
        for s in r["steps"]:
            if s["kind"] == "number":
                check("finite numeric reference and practice policy: " + label + "/" + s["id"],
                      math.isfinite(s["answer"]) and s["practiceOnly"] and
                      s["answerCheck"]["practiceOnly"] and
                      s["answerCheck"]["mode"] == "declared-rounding-equivalent" and
                      s["answerCheck"]["closeRelativeTolerance"] == .02 and
                      s["answerCheck"]["absoluteTolerance"] == 0.000001 and
                      s["answerFormat"]["decimalPlaces"] >= 0)
            elif s["kind"] == "choose":
                check("practice choice key: " + label + "/" + s["id"],
                      s["practiceOnly"] and s["answer"] in {c["id"] for c in s["choices"]})

wind = datasets["thalassa-wind-week-02"]
hours = sum(r["hours"] for r in wind["records"])
full = math.fsum(r["hours"] * r["outputFraction"] for r in wind["records"])
cf = full / hours
wr = missions["thalassa-wind-survey"]["routes"][0]
answers = {s["id"]: s["answer"] for s in wr["steps"] if s["kind"] == "number"}
check("wind independently recomputed", hours == 168 and full == 56.5 and
      near(cf, 0.33630952380952384) and answers["hours"] == hours and
      answers["full-power"] == full and near(answers["capacity-factor"], cf))
check("bounded contiguous wind bands", wind["records"][0]["lowerMps"] == 0 and
      wind["records"][-1]["upperMps"] == 20 and all(
          a["upperMps"] == b["lowerMps"] and not a["upperInclusive"]
          for a, b in zip(wind["records"], wind["records"][1:])))
check("legacy lab link remains hidden", missions["thalassa-wind-survey"]["optionalLab"]["enabledInAssessedFlow"] is False and
      missions["thalassa-wind-survey"]["optionalLab"]["reviewedScenarioVersion"] is None)
plans = datasets["thalassa-plan-cards-02"]
check("declared rounded planning CF", plans["planningCapacityFactor"] == round(cf, 2) == 0.34)
for p in plans["plans"]:
    daily = p["windUnits"] * p["windKWEach"] * plans["planningCapacityFactor"] * 24 + p["solarKWhDay"]
    stress = p["windUnits"] * p["windKWEach"] * plans["stressCase"]["capacityFactor"] * 24 + p["solarKWhDay"]
    check("plan calculation: " + p["id"], near(daily, p["referenceDailyKWh"]) and
          near(daily - plans["demandKWhDay"], p["referenceSurplusKWhDay"]) and
          near(stress, p["stressDailyKWh"]) and daily >= plans["demandKWhDay"] > stress and
          p["installationMassTonnes"] <= plans["constraints"]["maxInstallationMassTonnes"] and
          p["deckAreaM2"] <= plans["constraints"]["maxDeckAreaM2"])
rates = datasets["journey-constant-rate-02"]
for o in rates["options"]:
    seconds = rates["distanceKm"] / o["averageSpeedKmS"]
    days = seconds / rates["secondsPerDay"]
    food = rates["crew"] * rates["foodKgPersonDay"] * math.ceil(days)
    check("guided calculation: " + o["id"], near(seconds, o["referenceSeconds"]) and
          near(days, o["referenceDays"]) and math.ceil(days) == o["provisionDays"] and near(food, o["referenceFoodKg"]))
a = datasets["journey-mass-power-case-02"]
c = a["dryMassKg"] * (math.exp(a["deltaVMps"] / (a["chemicalIspSeconds"] * a["standardGravityApproxMps2"])) - 1)
i = a["dryMassKg"] * (math.exp(a["deltaVMps"] / (a["ionIspSeconds"] * a["standardGravityApproxMps2"])) - 1)
cs = a["chemicalDays"] * a["crew"] * a["suppliesKgPersonDay"]
ins = a["ionDays"] * a["crew"] * a["suppliesKgPersonDay"]
flux = a["fluxAtThalassaWm2"] / a["ignisDistanceRatio"] ** 2
expected = dict(chemicalPropellantKg=c, ionPropellantKg=i, chemicalSuppliesKg=cs,
                ionSuppliesKg=ins, extraIonSuppliesKg=ins-cs, fluxAtIgnisWm2=flux,
                panelElectricalWm2=flux*a["panelEfficiency"],
                ionPanelAreaM2=a["ionPropulsionPowerW"]/(flux*a["panelEfficiency"]),
                representedChemicalAddedMassKg=c+cs, representedIonAddedMassKg=i+ins)
check("advanced independent exp calculation", all(near(v, a["referenceResults"][k]) for k, v in expected.items()))
check("ion scenarios remain distinct", a["ionDays"] == 140 and near(rates["options"][1]["referenceDays"], 69.44444444444444) and
      missions["spacecraft-journey"]["routes"][0]["scenarioIds"] != missions["spacecraft-journey"]["routes"][1]["scenarioIds"])
check("declared rounded numeric targets", round(c / 10) * 10 == 19070 and round(i / 10) * 10 == 1840 and
      round(ins-cs, 1) == 1558.2 and round(expected["ionPanelAreaM2"]) == 256)

payload_sizes = []
for e in bundle["referenceArtifacts"]:
    q = e["request"]
    mid = e["endpoint"].split("/")[-2]
    m = missions[mid]
    r = next(r for r in m["routes"] if r["id"] == q["routeId"])
    required = {p["partId"]: p for p in r["requiredParts"]}
    parts = q["evidence"]
    size = len(json.dumps(q, ensure_ascii=False, separators=(",", ":")).encode())
    payload_sizes.append(dict(name=e["name"], utf8Bytes=size, parts=len(parts)))
    check("exemplar identity: " + e["name"], q["releaseId"] == bundle["releaseId"] and
          q["missionVersion"] == m["version"] and q["taskId"] == r["taskId"] and
          q["policyVersion"] == bundle["policy"]["version"] and q["contractVersion"] == "1.0.0" and
          q["supportMode"] in r["supportModes"] and e["educatorApproval"] is False)
    check("exemplar required parts and bounds: " + e["name"], unique([p["partId"] for p in parts]) and
          {p["partId"] for p in parts} == required.keys() and len(parts) <= 8 and size <= 65536 and
          20 <= len(q["reflection"].strip()) <= 2000 and
          bool(re.fullmatch(r"[\x21-\x7e]{16,128}", e["headers"]["Idempotency-Key"])))
    for p in parts:
        ok = p["kind"] in required[p["partId"]]["anyOfKinds"]
        if p["kind"] == "text":
            ok &= 1 <= len(p["text"].strip()) <= 2000
        elif p["kind"] == "table":
            ok &= 1 <= len(p["columns"]) <= 8 and 1 <= len(p["rows"]) <= 30 and all(
                len(row) == len(p["columns"]) and all(isinstance(cell, str) and len(cell) <= 200 for cell in row)
                for row in p["rows"])
        elif p["kind"] == "choice":
            ok &= p["selectedId"] in r["choiceOptions"][p["partId"]] and 1 <= len(p["reason"].strip()) <= 2000
        elif p["kind"] == "diagram":
            ids = {n["id"] for n in p["nodes"]}
            ok &= len(ids) == len(p["nodes"]) <= 12 and len(p["edges"]) <= 20 and all(
                e["fromId"] in ids and e["toId"] in ids and len(e["label"]) <= 120 for e in p["edges"]) and all(
                len(n["label"]) <= 120 for n in p["nodes"]) and 1 <= len(p["description"].strip()) <= 2000
        check("exemplar part: " + e["name"] + "/" + p["partId"], ok)
check("positive accessible and diagram alternatives", len(bundle["referenceArtifacts"]) == 5 and
      any(p["kind"] == "diagram" for e in bundle["referenceArtifacts"] for p in e["request"]["evidence"]) and
      any(p["partId"] == "weighted-results" and p["kind"] == "text" for e in bundle["referenceArtifacts"] for p in e["request"]["evidence"]))

commit = bundle["compatibility"]["sourceWorkstationsCommit"]
module_paths = ["src/features/universe/missions/thalassaWindSurvey.js", "src/features/universe/missions/spacecraftJourney.js"]
encoded = [base64.b64encode(subprocess.check_output(["git", "show", commit + ":" + path], cwd=ROOT)).decode() for path in module_paths]
js = "const w=await import('data:text/javascript;base64,'+process.argv[1]);const j=await import('data:text/javascript;base64,'+process.argv[2]);console.log(JSON.stringify({wind:w.WIND_WEEK,wm:w.THALASSA_WIND_SURVEY,jm:j.SPACECRAFT_JOURNEY,world:j.WORLD}));"
legacy = json.loads(subprocess.check_output(["node", "--input-type=module", "-e", js, *encoded], text=True))
check("historical wind quantities retained", [(r["hours"], r["outputFraction"]) for r in wind["records"]] ==
      [(r["hours"], r["output"]) for r in legacy["wind"]])
for lm in [legacy["wm"], legacy["jm"]]:
    nm = missions[lm["id"]]
    for lr in lm["routes"]:
        nr = next(r for r in nm["routes"] if r["id"] == lr["id"])
        newids = [s["id"] for s in nr["steps"]]
        indexes = [newids.index(s["id"]) for s in lr["steps"]]
        check("legacy step IDs retained in order: " + lm["id"] + "/" + lr["id"], indexes == sorted(indexes))
w = legacy["world"]
check("legacy journey primary inputs retained", rates["distanceKm"] == w["distanceKm"] and rates["crew"] == w["crew"] and
      rates["foodKgPersonDay"] == w["foodKgPerPersonDay"] and a["dryMassKg"] == w["dryMassKg"] and
      a["deltaVMps"] == w["deltaVKmS"]*1000 and a["ionDays"] == w["tripDaysIon"] and
      a["chemicalDays"] == w["tripDaysChemical"] and a["chemicalIspSeconds"] == w["ispChemicalS"] and
      a["ionIspSeconds"] == w["ispIonS"] and a["panelEfficiency"] == w["panelEfficiency"])
for name, mid in [("THALASSA-WIND-SURVEY-0.2.0-DRAFT.md", "thalassa-wind-survey"),
                  ("SPACECRAFT-JOURNEY-0.2.0-DRAFT.md", "spacecraft-journey")]:
    text = (HERE/name).read_text()
    check("readable pack matches hash: " + mid, missions[mid]["contentSha256"] in text)
    check("readable pack required part IDs: " + mid, all(p["partId"] in text for r in missions[mid]["routes"] for p in r["requiredParts"]))
    check("readable pack relative links: " + mid, all((HERE/url).exists() for url in re.findall(r"\]\(([^)]+)\)", text) if not url.startswith("https://")))

report = dict(checkedAt=datetime.now(timezone.utc).isoformat(timespec="seconds"),
              scope="Authoring data checks only. Not an application, shared-validator, API, emulator, build, device, accessibility or educator assessment result.",
              bundleContentSha256=bundle["bundleContentSha256"], authoringRevision=bundle["authoringRevision"],
              historicalSourceCommit=commit, passed=all(c["passed"] for c in checks),
              checkCount=len(checks), failedChecks=[c for c in checks if not c["passed"]], checks=checks,
              exemplarPayloadSizes=payload_sizes,
              computedWind=dict(hours=hours, fullPowerHours=full, rawCapacityFactor=cf, planningCapacityFactor=round(cf,2),
                                exactWeekKWh=full*wind["ratedPowerKW"], rawDailyKWh=cf*24*wind["ratedPowerKW"]),
              untested=["Actual runtime validators and API behavior", "Builds and deployment packaging", "Keyboard/screen-reader/device flows",
                        "NGSS proficiency, science/curriculum approval and age suitability", "External source content re-fetch during this check"])
(HERE/"validation-report.json").write_text(json.dumps(report, ensure_ascii=False, indent=2, allow_nan=False)+"\n")
print(json.dumps({k: report[k] for k in ["passed", "checkCount", "failedChecks", "bundleContentSha256", "exemplarPayloadSizes"]}, indent=2))
raise SystemExit(0 if report["passed"] else 1)
