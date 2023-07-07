
const FacilityInfo = `
<div style="
    margin: 15px 0;
    display: flex;
">
    <img 
        src="@[ASSERTS]office-building.svg"
        style="
            margin-top: 2%;
            width: 6%;
            margin-right: 2%
        "
    />
    <div style="font-weight: 600;font-size: 12px;width: 94%;">
        <div style="color:#2988e6;font-weight: 700;font-size: 16px">@[Facility Name]</div>
        <div style="color:#2988e6;margin-top: 2%;">@[Facility Name]</div>
        <div style="display:flex;justify-content: start;margin-top: 2%;width: 100%;">
            <div style="display:flex;width: 18%;">
                <div>Main #</div>
                <div style="color:#2988e6;margin-left:2%">@[Main #]</div>
            </div>
            <div style="display:flex;width: 18%;margin-left:2%;">
                <div>Email</div>
                <div style="color:#2988e6;margin-left:2%">@[Email]</div>
            </div>
        </div>
        <div style="display:flex;justify-content: start;margin-top: 2%;width: 100%;">
            <div style="display:flex;width: 18%;">
                <div>Fax #</div>
                <div style="color:#2988e6;margin-left:2%">@[Fax #]</div>
            </div>
            <div style="display:flex;width: 18%;margin-left:2%;">
                <div>Website</div>
                <div style="color:#2988e6;margin-left:2%">@[Website]</div>
            </div>
        </div>
    </div>
</div>
`
const ProviderInfo = `
<div style="margin: 15px 0;width:400px;font-weight: 600;font-size: 14px;">
    <div style="color:#2988e6;font-size: 1.2em;">
        @Provider Name, @Provider Title
    </div>
    <div style="color:#2988e6;">
        @Provider Specielities
    </div>
    <div style="display:flex;width:100%;">
        <div style="width:80px;">LIC #</div>
        <div style="width:80px;color:#2988e6;margin-left: 10px;">@[LIC #]</div>
    </div>
    <div style="display:flex;width:100%;">
        <div style="width:80px;">NPI #</div>
        <div style="width:80px;color:#2988e6;margin-left: 10px;">@[NPI #]</div>
    </div>
    <div style="display:flex;width:100%;">
        <div style="width:80px;">DEA #</div>
        <div style="width:80px;color:#2988e6;margin-left: 10px;">@[DEA #]</div>
    </div>
    <div style="display:flex;width:100%;">
        <div style="width:80px;">Email</div>
        <div style="width:80px;color:#2988e6;margin-left: 10px;">@[Email]</div>
    </div>
    <div style="display:flex;width:100%;">
        <div style="width:80px;">Fax #</div>
        <div style="width:80px;color:#2988e6;margin-left: 10px;">@[Fax #]</div>
    </div>
    <div style="display:flex;width:100%;">
        <div style="width:80px;">Main #</div>
        <div style="width:80px;color:#2988e6;margin-left: 10px;">@[Main #]</div>
    </div>
    <div style="display:flex;width:100%;">
        <div style="width:80px;">Address</div>
        <div style="width:80px;color:#2988e6;margin-left: 10px;">@[Address]</div>
    </div>
</div>
`
const PatientInfo = `
<div style="margin: 15px 0;width:400px;font-weight: 600;font-size: 14px;">
    <div style="display:flex;width:100%;">
        <div style="width:150px;">Exam Date</div>
        <div style="width:150px;color:#2988e6;margin-left: 10px;">@[Exam Date]</div>
    </div>
    <div style="display:flex;width:100%;">
        <div style="width:150px;">Patient Name</div>
        <div style="width:150px;color:#2988e6;margin-left: 10px;">@[Patient Name]</div>
    </div>
    <div style="display:flex;width:100%;">
        <div style="width:150px;">Data of Biorth</div>
        <div style="width:150px;color:#2988e6;margin-left: 10px;">@[Data of Biorth]</div>
    </div>
    <div style="display:flex;width:100%;">
        <div style="width:150px;">Phone #</div>
        <div style="width:150px;color:#2988e6;margin-left: 10px;">@[Phone #]</div>
    </div>
    <div style="display:flex;width:100%;">
        <div style="width:150px;">Email</div>
        <div style="width:150px;color:#2988e6;margin-left: 10px;">@[Email]</div>
    </div>
    <div style="display:flex;width:100%;">
        <div style="width:150px;">Patient Address</div>
        <div style="width:150px;color:#2988e6;margin-left: 10px;">@[Patient Address]</div>
    </div>
</div>
`

const infoTemplate = new Map([
    ["FacilityInfo", FacilityInfo],
    ["ProviderInfo", ProviderInfo],
    ["PatientInfo", PatientInfo],
])

export default infoTemplate