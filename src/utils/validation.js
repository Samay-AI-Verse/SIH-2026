const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phonePattern = /^[6-9]\d{9}$/;

export function validateTeamInfo(form) {
    const errors = {};
    if (!form.teamName || !form.teamName.trim())
        errors.teamName = "Team name is required.";
    if (!form.leaderCourse)
        errors.leaderCourse = "Please select Degree / Stream (e.g. B.Tech, Diploma).";
    if (!form.leaderName || !form.leaderName.trim())
        errors.leaderName = "Team leader name is required.";
    if (!emailPattern.test(form.email || ""))
        errors.email = "Enter a valid email.";
    if (!phonePattern.test((form.phone || "").replace(/\s/g, "")))
        errors.phone = "Enter a valid 10-digit mobile number.";
    if (!form.leaderGender)
        errors.leaderGender = "Select the team leader gender.";
    if (!form.leaderBranch || !form.leaderBranch.trim())
        errors.leaderBranch = "Branch / Department is required.";
    if (!form.leaderYear)
        errors.leaderYear = "Select study year.";
    return errors;
}

export function validateMember(member, others = []) {
    const errors = {};
    if (!member.name || !member.name.trim()) {
        errors.name = "Member full name is required.";
    }
    if (!member.gender) {
        errors.gender = "Select member gender.";
    }
    if (!member.branch || !member.branch.trim()) {
        errors.branch = "Select / enter department or branch.";
    }
    if (!member.year) {
        errors.year = "Select study year.";
    }
    // If email is provided, validate format
    if (member.email && member.email.trim() && !emailPattern.test(member.email.trim())) {
        errors.email = "Enter a valid email address.";
    }
    // If phone is provided, validate format
    if (member.phone && member.phone.trim() && !phonePattern.test(member.phone.replace(/\s/g, ""))) {
        errors.phone = "Enter a valid 10-digit mobile number.";
    }

    const currentName = (member.name || "").trim().toLowerCase();
    if (currentName && others.some((item) => (item.name || "").trim().toLowerCase() === currentName && item.id !== member.id)) {
        errors.name = "This member name is already added to the team.";
    }

    return errors;
}

export function validateTeamRoster(members, minMembers = 6, maxMembers = 6) {
    const errors = {};
    if (members.length < minMembers || members.length > maxMembers) {
        errors.roster = `A team must have exactly ${minMembers} members (1 Leader + 5 Members). Currently added: ${members.length}.`;
    } else if (!members.some((member) => String(member.gender).toLowerCase() === "female")) {
        errors.roster = "At least one female member is mandatory in the 6-member team.";
    }
    return errors;
}

export function emptyMember(defaults) {
    return {
        id: defaults?.id || (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random())),
        name: defaults?.name || "",
        email: defaults?.email || "",
        phone: defaults?.phone || "",
        college: defaults?.college || "",
        course: defaults?.course || "",
        branch: defaults?.branch || "",
        year: defaults?.year || "",
        studentId: "",
        gender: defaults?.gender || "",
    };
}


