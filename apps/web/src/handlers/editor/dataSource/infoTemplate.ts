
const FacilityInfo = `
<div style="
    margin: 15px 0;
    display: flex;
">
    <img 
        src="@[ASSERTS]office-building.svg"
        style="
            margin-top: 25px;
            width: 50px;
            height: 50px;
        "
    />
    <div style="font-weight: 600;font-size: 14px;margin-left: 20px;">
        <div style="color:#2988e6;font-weight: 700;font-size: 16px;height: 25px;line-height: 25px;">@[Facility Name]</div>
        <div style="color:#2988e6;height: 25px;line-height: 25px;">@[Facility Name]</div>
        <div style="display:flex;height: 25px;line-height: 25px;">
            <div style="display:flex;">
                <div style="width:60px;">Main #</div>
                <div style="width:80px;color:#2988e6;">@[Main #]</div>
            </div>
            <div style="display:flex;">
                <div style="width:60px;">Email</div>
                <div style="width:80px;color:#2988e6;">@[Email]</div>
            </div>
        </div>
        <div style="display:flex;height: 25px;line-height: 25px;">
            <div style="display:flex;">
                <div style="width:60px;">Fax #</div>
                <div style="width:80px;color:#2988e6;">@[Fax #]</div>
            </div>
            <div style="display:flex;">
                <div style="width:60px;">Website</div>
                <div style="width:80px;color:#2988e6;">@[Website]</div>
            </div>
        </div>
    </div>
</div>
`
const ProviderInfo = `
<div style="margin: 15px 0;width:200px;font-weight: 600;font-size: 14px;">
    <div style="display:flex;width:100%;">
        <div style="width:60px;">Exam Date</div>
        <div style="width:80px;color:#2988e6;margin-left: 10px;">@[Exam Date]</div>
    </div>
    <div style="display:flex;width:100%;">
        <div style="width:60px;">Patient Name</div>
        <div style="width:80px;color:#2988e6;margin-left: 10px;">@[Patient Name]</div>
    </div>
    <div style="display:flex;width:100%;">
        <div style="width:60px;">Data of Biorth</div>
        <div style="width:80px;color:#2988e6;margin-left: 10px;">@[Data of Biorth]</div>
    </div>
    <div style="display:flex;width:100%;">
        <div style="width:60px;">Phone #</div>
        <div style="width:80px;color:#2988e6;margin-left: 10px;">@[Phone #]</div>
    </div>
    <div style="display:flex;width:100%;">
        <div style="width:60px;">Email</div>
        <div style="width:80px;color:#2988e6;margin-left: 10px;">@[Email]</div>
    </div>
    <div style="display:flex;width:100%;">
        <div style="width:60px;">Patient Address</div>
        <div style="width:80px;color:#2988e6;margin-left: 10px;">@[Patient Address]</div>
    </div>
</div>
`
const PatientInfo = ``

const infoTemplate = new Map([
    ["FacilityInfo", FacilityInfo],
    ["ProviderInfo", ProviderInfo],
    ["PatientInfo", PatientInfo],
])

export default infoTemplate